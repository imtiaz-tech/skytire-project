import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTireNetCostPricing, isSalePriceBelowRecommended } from '@/utils/pricing';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import slugify from 'slugify';
import { isAllowedWireWheelVideoFile, isValidYouTubeUrl } from '@/lib/youtube';
import { attachSourceInventories } from '@/lib/sourceInventory.server';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

// Generate an SEO-friendly slug with stopword filtering
function generateSeoSlug(name: string, brandName?: string, size?: string) {
  let titleParts = [];
  if (brandName) titleParts.push(brandName);
  titleParts.push(name);
  if (size) titleParts.push(size);
  
  const rawString = titleParts.join(' ');
  
  const stopwords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'for', 'as', 'at', 'by', 'in', 'of', 'on', 'to', 'with', 'is', 'are', 'was', 'were'
  ]);
  
  const cleanWords = rawString
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/[\s-]+/)
    .filter(word => word && !stopwords.has(word));
  
  return slugify(cleanWords.join('-'), {
    lower: true,
    strict: true,
    trim: true
  });
}

// Get unique slug by appending counters if needed
async function getUniqueSlug(baseSlug: string, currentId?: string) {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.boltOnWireWheel.findFirst({
      where: {
        slug,
        ...(currentId ? { NOT: { id: currentId } } : {})
      }
    });
    if (!existing) {
      break;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const boltOnWireWheel = await prisma.boltOnWireWheel.findUnique({
      where: { id },
      include: {
        brand: true,
        source: true,
      },
    });

    if (!boltOnWireWheel) {
      return NextResponse.json({ error: 'bolt-on Wire Wheel not found' }, { status: 404 });
    }

    const withInventory = await attachSourceInventories('boltOnWheel', boltOnWireWheel);
    return NextResponse.json(withInventory);
  } catch (error) {
    console.error('Error fetching wire wheel:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();

    const name = formData.get('name') as string;
    const sku = formData.get('sku') as string;
    const alternatePartNumber = formData.get('alternatePartNumber') as string;
    const upcNo = formData.get('upcNo') as string;
    const description = formData.get('description') as string;
    const size = formData.get('size') as string;
    const finish = formData.get('finish') as string;
    const countryOfOrigin = formData.get('countryOfOrigin') as string;
    const brandId = formData.get('brandId') as string;
    const sourceId = formData.get('sourceId') as string;
    
    const stockStr = formData.get('stock') as string;
    const costStr = formData.get('cost') as string;
    const internalShippingStr = formData.get('internalShipping') as string;
    const processingChargesStr = formData.get('processingCharges') as string;
    const marginStr = formData.get('margin') as string;
    const processingAmountStr = formData.get('processingAmount') as string;
    const marginAmountStr = formData.get('marginAmount') as string;
    const netCostStr = formData.get('netCost') as string;
    const minimumSalePriceStr = formData.get('minimumSalePrice') as string;
    const salePriceStr = formData.get('salePrice') as string;
    const regularPriceStr = formData.get('regularPrice') as string;
    const mapPriceStr = formData.get('mapPrice') as string;
    const shippingCostStr = formData.get('shippingCost') as string;
    const handlingFeeStr = formData.get('handlingFee') as string;
    
    const packageInclude = formData.get('packageInclude') as string;
    const knockOffOption = formData.get('knockOffOption') as string;
    const options = formData.get('options') as string;
    const boltPattern = formData.get('boltPattern') as string;
    const accessories = formData.get('accessories') as string;
    
    const backSpacingStr = formData.get('backSpacing') as string;
    const spokeStr = formData.get('spoke') as string;
    const spokeStyle = formData.get('spokeStyle') as string;
    const offset = formData.get('offset') as string;
    
    const keywords = formData.get('keywords') as string;
    const seoTitle = formData.get('seoTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const staggeredFitmentStr = formData.get('staggeredFitment') as string;
    const wireWheelWeight = formData.get('wireWheelWeight') as string;
    const shippingDimensions = formData.get('shippingDimensions') as string;
    
    const platingDepthScoreStr = formData.get('platingDepthScore') as string;
    const sealingIntegrityScoreStr = formData.get('sealingIntegrityScore') as string;
    const spokeTensionScoreStr = formData.get('spokeTensionScore') as string;
    const feedbackScoreStr = formData.get('feedbackScore') as string;

    const isVisibleStr = formData.get('isVisible') as string;
    const isActiveStr = formData.get('isActive') as string;
    const status = formData.get('status') as string || 'draft';

    const sourceIdsStr = formData.get('sourceIds') as string; // in case UI sends it as array, but only ONE is selectable
    let finalSourceId = sourceId;
    if (!finalSourceId && sourceIdsStr) {
      try {
        const parsed = JSON.parse(sourceIdsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          finalSourceId = parsed[0];
        }
      } catch (e) {
        console.error('Error parsing sourceIds', e);
      }
    }

    const existingImagesRaw = formData.get('existingImages') as string;
    let existingImages: string[] = [];
    try {
      existingImages = JSON.parse(existingImagesRaw || '[]');
    } catch (e) {
      console.error('Error parsing existing images:', e);
    }

    const newImageFiles = formData.getAll('images') as File[];

    const currentBoltOnWireWheel = await prisma.boltOnWireWheel.findUnique({
      where: { id },
      include: { source: true },
    });

    if (!currentBoltOnWireWheel) {
      return NextResponse.json({ error: 'bolt-on Wire Wheel not found' }, { status: 404 });
    }

    // Validation rules for Published records
    if (status === 'published') {
      if (!brandId) return NextResponse.json({ error: 'Brand must be selected' }, { status: 400 });
      if (!name) return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
      if (!sku) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
      if (!size) return NextResponse.json({ error: 'Size is required' }, { status: 400 });
      if (!finalSourceId) return NextResponse.json({ error: 'Inventory Source is required' }, { status: 400 });

      const costNum = parseFloat(costStr) || 0;
      const regularNum = parseFloat(regularPriceStr) || 0;
      const saleNum = parseFloat(salePriceStr) || 0;
      const mapNum = parseFloat(mapPriceStr) || 0;
      const stockNum = parseInt(stockStr) || 0;
      const tirePricing = calculateTireNetCostPricing(
        costNum,
        parseFloat(internalShippingStr) || 0,
        parseFloat(processingChargesStr) || 0,
        parseFloat(marginStr) || 0
      );

      if (stockNum <= 0) return NextResponse.json({ error: 'Stock must be greater than 0' }, { status: 400 });
      if (costNum <= 0) return NextResponse.json({ error: 'Cost Price is required' }, { status: 400 });
      if (saleNum <= 0) return NextResponse.json({ error: 'Sale Price is required' }, { status: 400 });
      if (regularNum <= 0) return NextResponse.json({ error: 'Regular Price is required' }, { status: 400 });
      if (mapNum <= 0) return NextResponse.json({ error: 'MAP Price is required' }, { status: 400 });

      if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
        return NextResponse.json(
          { error: 'Sale Price cannot be lower than the Recommended Sale Price.' },
          { status: 400 }
        );
      }
      if (regularNum <= saleNum) {
        return NextResponse.json({ error: 'Regular price must be greater than sale price' }, { status: 400 });
      }
      if (saleNum < mapNum) {
        return NextResponse.json({ error: 'Sale price must be greater than or equal to MAP price' }, { status: 400 });
      }

      // Check score ranges
      const plating = parseInt(platingDepthScoreStr) || 0;
      const sealing = parseInt(sealingIntegrityScoreStr) || 0;
      const tension = parseInt(spokeTensionScoreStr) || 0;
      const feedback = parseInt(feedbackScoreStr) || 0;
      if (plating < 0 || plating > 10) return NextResponse.json({ error: 'Plating Depth Score must be between 0 and 10' }, { status: 400 });
      if (sealing < 0 || sealing > 10) return NextResponse.json({ error: 'Sealing Integrity Score must be between 0 and 10' }, { status: 400 });
      if (tension < 0 || tension > 10) return NextResponse.json({ error: 'Spoke Tension Score must be between 0 and 10' }, { status: 400 });
      if (feedback < 0 || feedback > 10) return NextResponse.json({ error: 'Feedback Score must be between 0 and 10' }, { status: 400 });
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Parse floatingCaps and knockOffs structures (now arrays)
    let floatingCaps: any[] = [];
    const floatingCapsRaw = formData.get('floatingCaps') as string;
    if (floatingCapsRaw) {
      try {
        floatingCaps = JSON.parse(floatingCapsRaw);
        if (!Array.isArray(floatingCaps)) {
          floatingCaps = [];
        }
      } catch (e) {
        console.error('Error parsing floatingCaps', e);
      }
    }

    let knockOffs: any[] = [];
    const knockOffsRaw = formData.get('knockOffs') as string;
    if (knockOffsRaw) {
      try {
        knockOffs = JSON.parse(knockOffsRaw);
        if (!Array.isArray(knockOffs)) {
          knockOffs = [];
        }
      } catch (e) {
        console.error('Error parsing knockOffs', e);
      }
    }

    // Process multiple floating caps images
    if (floatingCaps && Array.isArray(floatingCaps)) {
      for (let i = 0; i < floatingCaps.length; i++) {
        const cap = floatingCaps[i];
        if (cap.tempImageKey) {
          const capImageFile = formData.get(cap.tempImageKey) as File | null;
          if (capImageFile && capImageFile.size > 0) {
            const bytes = await capImageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${Date.now()}-cap-${i}-${capImageFile.name.replace(/\s+/g, '-')}`;
            const path = join(UPLOAD_DIR, filename);
            await writeFile(path, buffer);
            cap.image = filename;
          }
          delete cap.tempImageKey;
        }
      }
    }

    // Process multiple knockoffs and their nested chips images
    if (knockOffs && Array.isArray(knockOffs)) {
      for (let i = 0; i < knockOffs.length; i++) {
        const knockoff = knockOffs[i];
        
        // Handle knockoff option main image
        if (knockoff.tempImageKey) {
          const knockoffImageFile = formData.get(knockoff.tempImageKey) as File | null;
          if (knockoffImageFile && knockoffImageFile.size > 0) {
            const bytes = await knockoffImageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = `${Date.now()}-knock-${i}-${knockoffImageFile.name.replace(/\s+/g, '-')}`;
            const path = join(UPLOAD_DIR, filename);
            await writeFile(path, buffer);
            knockoff.image = filename;
          }
          delete knockoff.tempImageKey;
        }

        // Handle nested chips images inside this knockoff option
        if (knockoff.chips && Array.isArray(knockoff.chips)) {
          for (let j = 0; j < knockoff.chips.length; j++) {
            const chip = knockoff.chips[j];
            if (chip.tempImageKey) {
              const chipImageFile = formData.get(chip.tempImageKey) as File | null;
              if (chipImageFile && chipImageFile.size > 0) {
                const bytes = await chipImageFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const filename = `${Date.now()}-chip-${i}-${j}-${chipImageFile.name.replace(/\s+/g, '-')}`;
                const path = join(UPLOAD_DIR, filename);
                await writeFile(path, buffer);
                chip.image = filename;
              }
              delete chip.tempImageKey;
            }
          }
        }
      }
    }

    // Save product images (preserve drag-and-drop order via imageOrder when provided)
    const newSavedImageNames: string[] = [];
    for (const file of newImageFiles) {
      if (file.size === 0) continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = join(UPLOAD_DIR, filename);
      await writeFile(path, buffer);
      newSavedImageNames.push(filename);
    }

    let imageOrder: string[] = [];
    try {
      imageOrder = JSON.parse((formData.get('imageOrder') as string) || '[]');
      if (!Array.isArray(imageOrder)) imageOrder = [];
    } catch {
      imageOrder = [];
    }

    let allImages: string[];
    if (imageOrder.length > 0) {
      let newIdx = 0;
      allImages = imageOrder
        .map((token) => {
          if (typeof token === 'string' && token.startsWith('__new__:')) {
            return newSavedImageNames[newIdx++] || null;
          }
          return typeof token === 'string' ? token : null;
        })
        .filter((name): name is string => Boolean(name));
    } else {
      allImages = [...existingImages, ...newSavedImageNames];
    }

    // Optional product video (max 1) + optional YouTube URL
    const existingVideo = ((formData.get('existingVideo') as string) || '').trim() || null;
    const youtubeUrlRaw = ((formData.get('youtubeUrl') as string) || '').trim();
    if (youtubeUrlRaw && !isValidYouTubeUrl(youtubeUrlRaw)) {
      return NextResponse.json({ error: 'Please enter a valid YouTube Video URL' }, { status: 400 });
    }
    const youtubeUrl = youtubeUrlRaw || null;

    let videoFilename: string | null = existingVideo;
    const videoFile = formData.get('video') as File | null;
    if (videoFile && typeof videoFile === 'object' && 'size' in videoFile && videoFile.size > 0) {
      if (!isAllowedWireWheelVideoFile(videoFile)) {
        return NextResponse.json(
          { error: 'Video must be an mp4, mov, or webm file' },
          { status: 400 }
        );
      }
      const bytes = await videoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-video-${videoFile.name.replace(/\s+/g, '-')}`;
      const path = join(UPLOAD_DIR, filename);
      await writeFile(path, buffer);
      videoFilename = filename;
    }

    // Slug generation logic (re-generate only if important fields changed)
    const brandChanged = brandId !== currentBoltOnWireWheel.brandId;
    const nameChanged = name !== currentBoltOnWireWheel.name;
    const sizeChanged = size !== currentBoltOnWireWheel.size;

    let slug = currentBoltOnWireWheel.slug;
    let oldSlugs = [...currentBoltOnWireWheel.oldSlugs];

    if (brandChanged || nameChanged || sizeChanged) {
      let brandName = '';
      if (brandId) {
        const brandObj = await prisma.brand.findUnique({ where: { id: brandId } });
        if (brandObj) brandName = brandObj.brandName;
      }
      const baseSlug = generateSeoSlug(name || 'draft-bolt-on-wire-wheel', brandName, size);
      const uniqueSlug = await getUniqueSlug(baseSlug, id);
      if (uniqueSlug !== currentBoltOnWireWheel.slug) {
        slug = uniqueSlug;
        if (!oldSlugs.includes(currentBoltOnWireWheel.slug)) {
          oldSlugs.push(currentBoltOnWireWheel.slug);
        }
      }
    }

    const updatedBoltOnWireWheel = await prisma.boltOnWireWheel.update({
      where: { id },
      data: {
        sku: sku || null,
        alternatePartNumber: alternatePartNumber || null,
        upcNo: upcNo || null,
        name: name || 'Draft bolt-on Wire Wheel',
        description: description || null,
        images: allImages,
        video: videoFilename,
        youtubeUrl,
        knockOffs: knockOffs || {},
        floatingCaps: floatingCaps || {},
        size: size || '',
        finish: finish || null,
        countryOfOrigin: countryOfOrigin || null,
        brandId: brandId || null,
        sourceId: finalSourceId || null,
        stock: parseInt(stockStr) || 0,
        cost: Math.round(parseFloat(costStr) * 100) / 100 || 0,
        internalShipping: Math.round(parseFloat(internalShippingStr) * 100) / 100 || 0,
        processingCharges: parseFloat(processingChargesStr) || 0,
        margin: parseFloat(marginStr) || 0,
        processingAmount: Math.round(parseFloat(processingAmountStr) * 100) / 100 || 0,
        marginAmount: Math.round(parseFloat(marginAmountStr) * 100) / 100 || 0,
        netCost: Math.round(parseFloat(netCostStr) * 100) / 100 || 0,
        minimumSalePrice: Math.round(parseFloat(minimumSalePriceStr) * 100) / 100 || 0,
        salePrice: Math.round(parseFloat(salePriceStr) * 100) / 100 || 0,
        regularPrice: Math.round(parseFloat(regularPriceStr) * 100) / 100 || 0,
        mapPrice: Math.round(parseFloat(mapPriceStr) * 100) / 100 || 0,
        shippingCost: Math.round(parseFloat(shippingCostStr) * 100) / 100 || 0,
        handlingFee: Math.round(parseFloat(handlingFeeStr) * 100) / 100 || 0,
        packageInclude: packageInclude || null,
        knockOffOption: knockOffOption || null,
        options: options || null,
        boltPattern: boltPattern || null,
        accessories: accessories || null,
        backSpacing: backSpacingStr ? parseFloat(backSpacingStr) : null,
        spoke: spokeStr ? parseInt(spokeStr) : null,
        spokeStyle: spokeStyle || null,
        offset: offset || null,
        keywords: keywords || null,
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        staggeredFitment: staggeredFitmentStr === 'true',
        wireWheelWeight: wireWheelWeight || null,
        shippingDimensions: shippingDimensions || null,
        platingDepthScore: platingDepthScoreStr ? parseInt(platingDepthScoreStr) : 0,
        sealingIntegrityScore: sealingIntegrityScoreStr ? parseInt(sealingIntegrityScoreStr) : 0,
        spokeTensionScore: spokeTensionScoreStr ? parseInt(spokeTensionScoreStr) : 0,
        feedbackScore: feedbackScoreStr ? parseInt(feedbackScoreStr) : 0,
        status,
        isVisible: isVisibleStr !== 'false',
        isActive: isActiveStr !== 'false',
        slug,
        oldSlugs,
      },
      include: {
        brand: true,
        source: true,
      },
    });

    return NextResponse.json(updatedBoltOnWireWheel);
  } catch (error) {
    console.error('Error updating wire wheel:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'SKU or Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.boltOnWireWheel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'bolt-on Wire Wheel deleted successfully' });
  } catch (error) {
    console.error('Error deleting wire wheel:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
