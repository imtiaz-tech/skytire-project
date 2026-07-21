import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTireNetCostPricing, isSalePriceBelowRecommended } from '@/utils/pricing';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { isValidYouTubeUrl } from '@/lib/youtube';
import { attachSourceInventories } from '@/lib/sourceInventory.server';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

function isAllowedVideoUpload(file: File): boolean {
  const name = (file.name || '').toLowerCase();
  const hasExt = ALLOWED_VIDEO_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasMime = !file.type || ALLOWED_VIDEO_TYPES.includes(file.type);
  return hasExt && hasMime;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wheel = await prisma.wheel.findUnique({
      where: { id },
      include: {
        brand: true,
        sources: true,
      },
    });

    if (!wheel) {
      return NextResponse.json({ error: 'Wheel not found' }, { status: 404 });
    }

    const withInventory = await attachSourceInventories('wheel', wheel);
    return NextResponse.json(withInventory);
  } catch (error) {
    console.error('Error fetching wheel:', error);
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

    const sku = formData.get('sku') as string;
    const productName = formData.get('productName') as string;
    const brandId = formData.get('brandId') as string;
    const brandVariant = formData.get('brandVariant') as string;
    const displayStyleNo = formData.get('displayStyleNo') as string;
    const finish = formData.get('finish') as string;
    const wheelSize = formData.get('wheelSize') as string;
    const style = formData.get('style') as string;
    const alternatePartNumber = formData.get('alternatePartNumber') as string;
    const upcNo = formData.get('upcNo') as string;
    const lugCountStr = formData.get('lugCount') as string;
    const boltPatternInches = formData.get('boltPatternInches') as string;
    const boltPatternMM = formData.get('boltPatternMM') as string;
    const loadRatingKg = formData.get('loadRatingKg') as string;
    const loadRatingLbs = formData.get('loadRatingLbs') as string;
    const offset = formData.get('offset') as string;
    const backSpacingStr = formData.get('backSpacing') as string;
    const centerBore = formData.get('centerBore') as string;
    const shippingWeight = formData.get('shippingWeight') as string;
    const shippingDimensions = formData.get('shippingDimensions') as string;
    const description = formData.get('description') as string;
    const invOrderType = formData.get('invOrderType') as string;
    
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
    const isFeaturedStr = formData.get('isFeatured') as string;
    const isVisibleStr = formData.get('isVisible') as string;
    const isActiveStr = formData.get('isActive') as string;
    const category = formData.get('category') as string || 'none';
    const status = formData.get('status') as string || 'draft';
    const keywords = formData.get('keywords') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const seoTitle = formData.get('seoTitle') as string;
    const finishDurabilityScoreStr = formData.get('finishDurabilityScore') as string;
    const fitmentPrecisionScoreStr = formData.get('fitmentPrecisionScore') as string;
    const impactResistanceScoreStr = formData.get('impactResistanceScore') as string;
    const feedbackScoreStr = formData.get('feedbackScore') as string;

    const sourceIdsStr = formData.get('sourceIds') as string;
    let sourceIds: string[] = [];
    try {
      if (sourceIdsStr) {
        sourceIds = JSON.parse(sourceIdsStr);
      }
    } catch (e) {
      console.error('Error parsing sourceIds', e);
    }

    const existingImagesRaw = formData.get('existingImages') as string;
    let existingImages: string[] = [];
    try {
      existingImages = JSON.parse(existingImagesRaw || '[]');
    } catch (e) {
      console.error('Error parsing existing images:', e);
    }

    const newImageFiles = formData.getAll('images') as File[];

    if (status === 'published') {
      if (!brandId) return NextResponse.json({ error: 'Brand must be selected' }, { status: 400 });
      if (!productName) return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
      if (!sku) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
      if (!wheelSize) return NextResponse.json({ error: 'Wheel Size is required' }, { status: 400 });
      if (!offset) return NextResponse.json({ error: 'Offset is required' }, { status: 400 });
      if (!sourceIds || sourceIds.length === 0) {
        return NextResponse.json({ error: 'Inventory Source is required' }, { status: 400 });
      }

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
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

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

    const allImages = [...existingImages, ...newSavedImageNames];

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
      if (!isAllowedVideoUpload(videoFile)) {
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

    const currentWheel = await prisma.wheel.findUnique({
      where: { id },
      include: { sources: true },
    });

    if (!currentWheel) {
      return NextResponse.json({ error: 'Wheel not found' }, { status: 404 });
    }

    const slug = productName !== currentWheel.productName
      ? `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
      : currentWheel.slug;

    const oldSlugs = productName !== currentWheel.productName
      ? [...currentWheel.oldSlugs, currentWheel.slug]
      : currentWheel.oldSlugs;

    const updatedWheel = await prisma.wheel.update({
      where: { id },
      data: {
        sku: sku || null,
        productName: productName || 'Draft Wheel',
        brandId: brandId || null,
        brandVariant: brandVariant || '',
        displayStyleNo: displayStyleNo || null,
        finish: finish || null,
        slug,
        oldSlugs,
        wheelSize: wheelSize || '',
        style: style || null,
        alternatePartNumber: alternatePartNumber || null,
        upcNo: upcNo || null,
        lugCount: lugCountStr ? parseInt(lugCountStr) : null,
        boltPatternInches: boltPatternInches || null,
        boltPatternMM: boltPatternMM || null,
        loadRatingKg: loadRatingKg || null,
        loadRatingLbs: loadRatingLbs || null,
        offset: offset || '',
        backSpacing: backSpacingStr ? parseFloat(backSpacingStr) : null,
        centerBore: centerBore || null,
        shippingWeight: shippingWeight || '',
        shippingDimensions: shippingDimensions || null,
        images: allImages,
        video: videoFilename,
        youtubeUrl,
        description: description || null,
        invOrderType: invOrderType || null,
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
        isFeatured: isFeaturedStr === 'true',
        isVisible: isVisibleStr !== 'false',
        isActive: isActiveStr !== 'false',
        category,
        status,
        keywords: keywords || null,
        metaDescription: metaDescription || null,
        seoTitle: seoTitle || null,
        finishDurabilityScore: finishDurabilityScoreStr ? parseInt(finishDurabilityScoreStr) : 0,
        fitmentPrecisionScore: fitmentPrecisionScoreStr ? parseInt(fitmentPrecisionScoreStr) : 0,
        impactResistanceScore: impactResistanceScoreStr ? parseInt(impactResistanceScoreStr) : 0,
        feedbackScore: feedbackScoreStr ? parseInt(feedbackScoreStr) : 0,
        sources: {
          set: sourceIds.map((id: string) => ({ id })),
        },
      },
      include: {
        brand: true,
        sources: true,
      },
    });

    return NextResponse.json(updatedWheel);
  } catch (error) {
    console.error('Error updating wheel:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
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
    await prisma.wheel.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Wheel deleted successfully' });
  } catch (error) {
    console.error('Error deleting wheel:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
