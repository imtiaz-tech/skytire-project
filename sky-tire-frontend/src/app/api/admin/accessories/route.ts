import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateTireNetCostPricing, isSalePriceBelowRecommended } from '@/utils/pricing';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { generateAccessorySlug, getUniqueAccessorySlug } from '@/lib/accessorySlug';
import { isAllowedWireWheelVideoFile, isValidYouTubeUrl } from '@/lib/youtube';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const publishStatus = searchParams.get('publishStatus');
  const isVisibleParam = searchParams.get('isVisible');
  const sortBy = searchParams.get('sortBy') || 'sku';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};
    if (publishStatus) where.status = publishStatus.toLowerCase();
    if (isVisibleParam !== null && isVisibleParam !== '') {
      where.isVisible = isVisibleParam === 'true';
    }

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' as const } },
        { alternatePartNumber: { contains: search, mode: 'insensitive' as const } },
        { upcNo: { contains: search, mode: 'insensitive' as const } },
        { productName: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
        { brand: { brandName: { contains: search, mode: 'insensitive' as const } } },
        { source: { source: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const [accessories, total] = await Promise.all([
      prisma.accessory.findMany({
        where,
        skip,
        take: limit,
        include: { source: true, brand: true },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.accessory.count({ where }),
    ]);

    return NextResponse.json({
      accessories,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching accessories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const leftImageFile = formData.get('leftImage') as File | null;
    const rightImageFile = formData.get('rightImage') as File | null;
    const imageFiles = formData.getAll('images') as File[];

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

      const totalImages = existingImages.length + imageFiles.filter((f) => f.size > 0).length;
      if (totalImages === 0) {
        return NextResponse.json({ error: 'At least one image is required to publish' }, { status: 400 });
      }
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const savedImageNames: string[] = [];
    for (const file of imageFiles) {
      if (file.size === 0) continue;
      savedImageNames.push(await saveImageFile(file));
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
            return savedImageNames[newIdx++] || null;
          }
          return typeof token === 'string' ? token : null;
        })
        .filter((name): name is string => Boolean(name));
    } else {
      allImages = [...existingImages, ...savedImageNames];
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

    let leftImage = existingLeftImage || null;
    if (leftImageFile && leftImageFile.size > 0) {
      leftImage = await saveImageFile(leftImageFile, '-left');
    }

    let rightImage = existingRightImage || null;
    if (rightImageFile && rightImageFile.size > 0) {
      rightImage = await saveImageFile(rightImageFile, '-right');
    }

    let specifications: Record<string, string> = {};
    if (specificationsRaw) {
      try {
        specifications = JSON.parse(specificationsRaw);
      } catch {
        specifications = {};
      }
    }

    const mapPrice = Number(parseFloat(mapPriceStr || '0').toFixed(2)) || 0;
    const mapPriceHistory = mapPrice > 0 ? [{ value: mapPrice, createdAt: new Date().toISOString() }] : [];

    const baseSlug = generateAccessorySlug(productName || 'draft-accessory');
    const uniqueSlug = await getUniqueAccessorySlug(baseSlug);

    const accessory = await prisma.accessory.create({
      data: {
        sku: sku || `DRAFT-${Date.now()}`,
        alternatePartNumber: alternatePartNumber || null,
        upcNo: upcNo || null,
        category: category || 'Lowrider Adapters',
        productName: productName || 'Draft Accessory',
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
        specifications,
        materialHardnessScore: materialHardnessScoreStr ? parseInt(materialHardnessScoreStr) : null,
        threadPrecisionScore: threadPrecisionScoreStr ? parseInt(threadPrecisionScoreStr) : null,
        torqueRetentionScore: torqueRetentionScoreStr ? parseInt(torqueRetentionScoreStr) : null,
        feedbackScore: feedbackScoreStr ? parseInt(feedbackScoreStr) : null,
        status,
        isVisible: isVisibleStr !== 'false',
        isFeatured: isFeaturedStr === 'true',
        slug: uniqueSlug,
        oldSlugs: [],
      },
      include: { source: true, brand: true },
    });

    return NextResponse.json(accessory);
  } catch (error) {
    console.error('Error creating accessory:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'SKU or Slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, isVisible } = body as { ids: string[]; isVisible: boolean };

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }
    if (typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'isVisible must be a boolean' }, { status: 400 });
    }

    const result = await prisma.accessory.updateMany({
      where: { id: { in: ids } },
      data: { isVisible },
    });

    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk-updating accessories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
