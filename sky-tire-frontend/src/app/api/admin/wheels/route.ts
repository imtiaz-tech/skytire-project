import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const UPLOAD_DIR = join(process.cwd(), '../sky-tire-api/uploads');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const publishStatus = searchParams.get('publishStatus');
  const sortBy = searchParams.get('sortBy') || 'sku';
  const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';

  const skip = (page - 1) * limit;

  try {
    let searchConditions: any[] = [
      { sku: { contains: search, mode: 'insensitive' as const } },
      { productName: { contains: search, mode: 'insensitive' as const } },
      { wheelSize: { contains: search, mode: 'insensitive' as const } },
      { alternatePartNumber: { contains: search, mode: 'insensitive' as const } },
      { upcNo: { contains: search, mode: 'insensitive' as const } },
      { brand: { brandName: { contains: search, mode: 'insensitive' as const } } },
    ];

    const where: any = {};
    if (publishStatus) where.status = publishStatus.toLowerCase(); // status is string 'draft' or 'published'

    if (search) {
      where.OR = searchConditions;
    }

    const [wheels, total] = await Promise.all([
      prisma.wheel.findMany({
        where,
        skip,
        take: limit,
        include: {
          brand: true,
          sources: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.wheel.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      wheels,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching wheels:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const description = formData.get('description') as string;
    const invOrderType = formData.get('invOrderType') as string;
    
    const stockStr = formData.get('stock') as string;
    const costStr = formData.get('cost') as string;
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

    const imageFiles = formData.getAll('images') as File[];

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

      if (stockNum <= 0) return NextResponse.json({ error: 'Stock must be greater than 0' }, { status: 400 });
      if (costNum <= 0) return NextResponse.json({ error: 'Cost Price is required' }, { status: 400 });
      if (saleNum <= 0) return NextResponse.json({ error: 'Sale Price is required' }, { status: 400 });
      if (regularNum <= 0) return NextResponse.json({ error: 'Regular Price is required' }, { status: 400 });
      if (mapNum <= 0) return NextResponse.json({ error: 'MAP Price is required' }, { status: 400 });

      if (saleNum < costNum) {
        return NextResponse.json({ error: 'Sale price must be greater than or equal to cost' }, { status: 400 });
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

    const savedImageNames: string[] = [];

    for (const file of imageFiles) {
      if (file.size === 0) continue;
      
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const path = join(UPLOAD_DIR, filename);
      
      await writeFile(path, buffer);
      savedImageNames.push(filename);
    }

    const slug = `${productName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

    const newWheel = await prisma.wheel.create({
      data: {
        sku: sku || `DRAFT-${Date.now()}`,
        productName: productName || 'Draft Wheel',
        brandId: brandId || null,
        brandVariant: brandVariant || '',
        displayStyleNo: displayStyleNo || null,
        finish: finish || null,
        slug,
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
        images: savedImageNames,
        description: description || null,
        invOrderType: invOrderType || null,
        stock: parseInt(stockStr) || 0,
        cost: Math.round(parseFloat(costStr) * 100) / 100 || 0,
        salePrice: Math.round(parseFloat(salePriceStr) * 100) / 100 || 0,
        regularPrice: Math.round(parseFloat(regularPriceStr) * 100) / 100 || 0,
        mapPrice: Math.round(parseFloat(mapPriceStr) * 100) / 100 || 0,
        shippingCost: Math.round(parseFloat(shippingCostStr) * 100) / 100 || 0,
        handlingFee: Math.round(parseFloat(handlingFeeStr) * 100) / 100 || 0,
        isFeatured: isFeaturedStr === 'true',
        isVisible: isVisibleStr !== 'false',
        category,
        status,
        keywords: keywords || null,
        metaDescription: metaDescription || null,
        seoTitle: seoTitle || null,
        isActive: isActiveStr !== 'false',
        finishDurabilityScore: finishDurabilityScoreStr ? parseInt(finishDurabilityScoreStr) : 0,
        fitmentPrecisionScore: fitmentPrecisionScoreStr ? parseInt(fitmentPrecisionScoreStr) : 0,
        impactResistanceScore: impactResistanceScoreStr ? parseInt(impactResistanceScoreStr) : 0,
        feedbackScore: feedbackScoreStr ? parseInt(feedbackScoreStr) : 0,
        sources: {
          connect: sourceIds.map((id: string) => ({ id })),
        },
      },
      include: {
        brand: true,
        sources: true,
      },
    });

    return NextResponse.json(newWheel);
  } catch (error) {
    console.error('Error creating wheel:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
