import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTireNetCostPricing, isSalePriceBelowRecommended } from '@/utils/pricing';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { generateAccessorySlug, getUniqueAccessorySlug } from '@/lib/accessorySlug';
import { isAllowedWireWheelVideoFile, isValidYouTubeUrl } from '@/lib/youtube';
import { attachSourceInventories } from '@/lib/sourceInventory.server';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

async function saveImageFile(file: File, prefix = ''): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}${prefix}-${file.name.replace(/\s+/g, '-')}`;
  const path = join(UPLOAD_DIR, filename);
  await writeFile(path, buffer);
  return filename;
}

function appendMapPriceHistory(
  currentHistory: unknown,
  newValue: number,
  previousValue?: number
): { value: number; createdAt: string }[] {
  let history: { value: number; createdAt: string }[] = [];
  if (Array.isArray(currentHistory)) {
    history = currentHistory as { value: number; createdAt: string }[];
  }
  if (previousValue === undefined || newValue !== previousValue) {
    history.push({ value: newValue, createdAt: new Date().toISOString() });
  }
  return history;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const accessory = await prisma.accessory.findUnique({
      where: { id },
      include: { source: true, brand: true },
    });

    if (!accessory) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }

    const withInventory = await attachSourceInventories('accessory', accessory);
    return NextResponse.json(withInventory);
  } catch (error) {
    console.error('Error fetching accessory:', error);
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

    const productName = formData.get('productName') as string;
    const sku = formData.get('sku') as string;
    const alternatePartNumber = formData.get('alternatePartNumber') as string;
    const upcNo = formData.get('upcNo') as string;
    const category = formData.get('category') as string;
    const brandId = formData.get('brandId') as string;
    const description = formData.get('description') as string;
    const sourceId = formData.get('sourceId') as string;
    const packageInclude = formData.get('packageInclude') as string;
    const specificationsRaw = formData.get('specifications') as string;

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

    const keywords = formData.get('keywords') as string;
    const seoTitle = formData.get('seoTitle') as string;
    const metaDescription = formData.get('metaDescription') as string;
    const faqs = formData.get('faqs') as string;
    const tagsRaw = formData.get('tags') as string;
    const alsoFoundInRaw = formData.get('alsoFoundIn') as string;
    let tags: string[] = [];
    let alsoFoundIn: string[] = [];
    try {
      tags = tagsRaw ? JSON.parse(tagsRaw) : [];
      if (!Array.isArray(tags)) tags = [];
    } catch {
      tags = [];
    }
    try {
      alsoFoundIn = alsoFoundInRaw ? JSON.parse(alsoFoundInRaw) : [];
      if (!Array.isArray(alsoFoundIn)) alsoFoundIn = [];
    } catch {
      alsoFoundIn = [];
    }

    const materialHardnessScoreStr = formData.get('materialHardnessScore') as string;
    const threadPrecisionScoreStr = formData.get('threadPrecisionScore') as string;
    const torqueRetentionScoreStr = formData.get('torqueRetentionScore') as string;
    const feedbackScoreStr = formData.get('feedbackScore') as string;

    const isVisibleStr = formData.get('isVisible') as string;
    const isFeaturedStr = formData.get('isFeatured') as string;
    const status = (formData.get('status') as string) || 'draft';

    const existingImagesRaw = formData.get('existingImages') as string;
    let existingImages: string[] = [];
    try {
      existingImages = JSON.parse(existingImagesRaw || '[]');
    } catch {
      existingImages = [];
    }

    const existingLeftImage = formData.get('existingLeftImage') as string;
    const existingRightImage = formData.get('existingRightImage') as string;
    const removeLeftImage = formData.get('removeLeftImage') === 'true';
    const removeRightImage = formData.get('removeRightImage') === 'true';
    const leftImageFile = formData.get('leftImage') as File | null;
    const rightImageFile = formData.get('rightImage') as File | null;
    const newImageFiles = formData.getAll('images') as File[];

    const current = await prisma.accessory.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: 'Accessory not found' }, { status: 404 });
    }

    if (status === 'published') {
      if (!productName?.trim()) return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
      if (!sku?.trim()) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
      if (!category?.trim()) return NextResponse.json({ error: 'Accessory Category is required' }, { status: 400 });
      if (!brandId) return NextResponse.json({ error: 'Brand is required' }, { status: 400 });
      if (!sourceId) return NextResponse.json({ error: 'Inventory Source is required' }, { status: 400 });

      const costNum = parseFloat(costStr) || 0;
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
      if (costNum <= 0) return NextResponse.json({ error: 'Cost is required' }, { status: 400 });
      if (saleNum <= 0) return NextResponse.json({ error: 'Sale Price is required' }, { status: 400 });
      if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
        return NextResponse.json(
          { error: 'Sale Price cannot be lower than the Recommended Sale Price.' },
          { status: 400 }
        );
      }
      if (mapNum > 0 && saleNum < mapNum) {
        return NextResponse.json({ error: 'Sale price must be greater than or equal to MAP price' }, { status: 400 });
      }

      const totalImages = existingImages.length + newImageFiles.filter((f) => f.size > 0).length;
      if (totalImages === 0) {
        return NextResponse.json({ error: 'At least one image is required to publish' }, { status: 400 });
      }
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const newSavedImageNames: string[] = [];
    for (const file of newImageFiles) {
      if (file.size === 0) continue;
      newSavedImageNames.push(await saveImageFile(file));
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
      videoFilename = await saveImageFile(videoFile, '-video');
    }

    let leftImage: string | null = removeLeftImage ? null : existingLeftImage || current.leftImage;
    if (leftImageFile && leftImageFile.size > 0) {
      leftImage = await saveImageFile(leftImageFile, '-left');
    }

    let rightImage: string | null = removeRightImage ? null : existingRightImage || current.rightImage;
    if (rightImageFile && rightImageFile.size > 0) {
      rightImage = await saveImageFile(rightImageFile, '-right');
    }

    let specifications: Record<string, string> = {};
    if (specificationsRaw) {
      try {
        specifications = JSON.parse(specificationsRaw);
      } catch {
        specifications = (current.specifications as Record<string, string>) || {};
      }
    }

    const mapPrice = Number(parseFloat(mapPriceStr || '0').toFixed(2)) || 0;
    const mapPriceHistory = appendMapPriceHistory(current.mapPriceHistory, mapPrice, current.mapPrice);

    let slug = current.slug;
    let oldSlugs = [...current.oldSlugs];
    if (productName !== current.productName) {
      const baseSlug = generateAccessorySlug(productName || 'draft-accessory');
      const uniqueSlug = await getUniqueAccessorySlug(baseSlug, id);
      if (uniqueSlug !== current.slug) {
        slug = uniqueSlug;
        if (!oldSlugs.includes(current.slug)) {
          oldSlugs.push(current.slug);
        }
      }
    }

    const accessory = await prisma.accessory.update({
      where: { id },
      data: {
        sku: sku || current.sku,
        alternatePartNumber: alternatePartNumber || null,
        upcNo: upcNo || null,
        category: category || current.category,
        productName: productName || current.productName,
        brandId: brandId || null,
        description: description || null,
        images: allImages,
        video: videoFilename,
        youtubeUrl,
        leftImage,
        rightImage,
        sourceId: sourceId || null,
        stock: parseInt(stockStr) || 0,
        cost: Math.round(parseFloat(costStr) * 100) / 100 || 1,
        internalShipping: Math.round(parseFloat(internalShippingStr) * 100) / 100 || 0,
        processingCharges: parseFloat(processingChargesStr) || 0,
        margin: parseFloat(marginStr) || 0,
        processingAmount: Math.round(parseFloat(processingAmountStr) * 100) / 100 || 0,
        marginAmount: Math.round(parseFloat(marginAmountStr) * 100) / 100 || 0,
        netCost: Math.round(parseFloat(netCostStr) * 100) / 100 || 0,
        minimumSalePrice: Math.round(parseFloat(minimumSalePriceStr) * 100) / 100 || 0,
        salePrice: Math.round(parseFloat(salePriceStr) * 100) / 100 || 1,
        regularPrice: regularPriceStr ? Number(parseFloat(regularPriceStr).toFixed(2)) : null,
        mapPrice,
        mapPriceHistory,
        shippingCost: Number(parseFloat(shippingCostStr || '0').toFixed(2)) || 0,
        handlingFee: Number(parseFloat(handlingFeeStr || '0').toFixed(2)) || 0,
        packageInclude: packageInclude || null,
        keywords: keywords || null,
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        faqs: faqs || null,
        tags,
        alsoFoundIn,
        specifications,
        materialHardnessScore: materialHardnessScoreStr ? parseInt(materialHardnessScoreStr) : null,
        threadPrecisionScore: threadPrecisionScoreStr ? parseInt(threadPrecisionScoreStr) : null,
        torqueRetentionScore: torqueRetentionScoreStr ? parseInt(torqueRetentionScoreStr) : null,
        feedbackScore: feedbackScoreStr ? parseInt(feedbackScoreStr) : null,
        status,
        isVisible: isVisibleStr !== 'false',
        isFeatured: isFeaturedStr === 'true',
        slug,
        oldSlugs,
      },
      include: { source: true, brand: true },
    });

    return NextResponse.json(accessory);
  } catch (error) {
    console.error('Error updating accessory:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'SKU or Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.accessory.delete({ where: { id } });
    return NextResponse.json({ message: 'Accessory deleted successfully' });
  } catch (error) {
    console.error('Error deleting accessory:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
