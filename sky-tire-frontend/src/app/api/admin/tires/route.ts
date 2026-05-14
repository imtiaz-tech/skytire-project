import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const sidewallCategory = searchParams.get('sidewallCategory');
  const publishStatus = searchParams.get('publishStatus');

  const skip = (page - 1) * limit;

  try {
    let searchConditions: any[] = [
      { sku: { contains: search, mode: 'insensitive' as const } },
      { tireSize: { contains: search, mode: 'insensitive' as const } },
      { alternatePartNumber: { contains: search, mode: 'insensitive' as const } },
      { upcNo: { contains: search, mode: 'insensitive' as const } },
      { speedRating: { contains: search, mode: 'insensitive' as const } },
      { loadRange: { contains: search, mode: 'insensitive' as const } },
      { utqg: { contains: search, mode: 'insensitive' as const } },
      { loadIndex: { contains: search, mode: 'insensitive' as const } },
      { model: { modelName: { contains: search, mode: 'insensitive' as const } } },
      { model: { brand: { brandName: { contains: search, mode: 'insensitive' as const } } } },
    ];

    // Handle VehicleType enum search
    const vehicleTypes = ['PASSENGER', 'LIGHT_TRUCK', 'SUV', 'TRUCK', 'COMMERCIAL', 'PERFORMANCE', 'OFF_ROAD'];
    const matchingVehicleTypes = vehicleTypes.filter(type => 
      type.toLowerCase().includes(search.toLowerCase())
    );
    if (matchingVehicleTypes.length > 0) {
      searchConditions.push({ vehicleType: { in: matchingVehicleTypes } });
    }

    // If search looks like a tire size without a slash (e.g., 23550R18), 
    // try searching with a slash inserted (235/50R18)
    if (search && !search.includes('/') && /^\d{5}/.test(search)) {
      const sizeWithSlash = search.replace(/^(\d{3})(\d{2})/, '$1/$2');
      searchConditions.push({ tireSize: { contains: sizeWithSlash, mode: 'insensitive' as const } });
    }

    const where: any = {};
    if (sidewallCategory) where.sidewallCategory = sidewallCategory;
    if (publishStatus) where.publishStatus = publishStatus;

    if (search) {
      where.OR = searchConditions;
    }

    const [tires, total] = await Promise.all([
      prisma.tire.findMany({
        where,
        skip,
        take: limit,
        include: {
          model: {
            include: {
              brand: true,
            },
          },
          sources: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tire.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      tires,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching tires:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      modelId,
      sku,
      alternatePartNumber,
      upcNo,
      stock,
      cost,
      salePrice,
      regularPrice,
      mapPrice,
      shippingCost,
      handlingFee,
      freightCharges,
      rebateAvailable,
      mileageScore,
      tractionScore,
      stabilityScore,
      feedbackScore,
      sourceIds,
      
      // Fields from TireSize
      tireSize,
      tireWidth,
      aspectRatio,
      rimDiameter,
      loadIndex,
      speedRating,
      loadRange,
      inflationPressure,
      tireWeight,
      shippingDimensions,
      utqg,
      seoTitle,
      metaDescription,
      status,
      vehicleType,
      keywords,
      features,
      sidewallCategory,
      sidewallDetail,
      publishStatus,
    } = body;

    if (publishStatus === 'DRAFT') {
      if (!modelId) {
        return NextResponse.json({ error: 'Model must be selected' }, { status: 400 });
      }
    } else {
      // Required Fields Validation
      if (!modelId) return NextResponse.json({ error: 'Model must be selected' }, { status: 400 });
      if (!tireSize) return NextResponse.json({ error: 'Tire Size is required' }, { status: 400 });
      if (!vehicleType) return NextResponse.json({ error: 'Vehicle Type is required' }, { status: 400 });
      if (!sidewallCategory) return NextResponse.json({ error: 'Sidewall Category is required' }, { status: 400 });
      if (!sku) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
      
      const costNum = parseFloat(cost) || 0;
      const regularNum = parseFloat(regularPrice) || 0;
      const saleNum = parseFloat(salePrice) || 0;
      const mapNum = parseFloat(mapPrice) || 0;
      const stockNum = parseInt(stock) || 0;

      if (stockNum <= 0) return NextResponse.json({ error: 'Stock must be greater than 0' }, { status: 400 });
      if (costNum <= 0) return NextResponse.json({ error: 'Cost Price is required' }, { status: 400 });
      if (saleNum <= 0) return NextResponse.json({ error: 'Sale Price is required' }, { status: 400 });
      if (regularNum <= 0) return NextResponse.json({ error: 'Regular Price is required' }, { status: 400 });
      if (mapNum <= 0) return NextResponse.json({ error: 'MAP Price is required' }, { status: 400 });

      // Price Logic Validations
      if (saleNum <= costNum) {
        return NextResponse.json({ error: 'Sale price must be greater than cost' }, { status: 400 });
      }
      if (regularNum <= saleNum) {
        return NextResponse.json({ error: 'Regular price must be greater than sale price' }, { status: 400 });
      }
      if (saleNum < mapNum) {
        return NextResponse.json({ error: 'Sale price must be greater than or equal to MAP price' }, { status: 400 });
      }
    }

    const newTire = await prisma.tire.create({
      data: {
        modelId,
        sku: sku || null,
        alternatePartNumber,
        upcNo,
        stock: parseInt(stock) || 0,
        cost: Math.round(parseFloat(cost) * 100) / 100 || 0,
        salePrice: Math.round(parseFloat(salePrice) * 100) / 100 || 0,
        regularPrice: Math.round(parseFloat(regularPrice) * 100) / 100 || 0,
        mapPrice: Math.round(parseFloat(mapPrice) * 100) / 100 || 0,
        shippingCost: Math.round(parseFloat(shippingCost) * 100) / 100 || 0,
        handlingFee: Math.round(parseFloat(handlingFee) * 100) / 100 || 0,
        freightCharges: Math.round(parseFloat(freightCharges) * 100) / 100 || 0,
        rebateAvailable: !!rebateAvailable,
        mileageScore: parseInt(mileageScore) || 0,
        tractionScore: parseInt(tractionScore) || 0,
        stabilityScore: parseInt(stabilityScore) || 0,
        feedbackScore: parseInt(feedbackScore) || 0,
        
        tireSize: tireSize || null,
        tireWidth,
        aspectRatio,
        rimDiameter,
        loadIndex,
        speedRating,
        loadRange,
        inflationPressure,
        tireWeight,
        shippingDimensions,
        utqg,
        seoTitle,
        metaDescription,
        status: status || 'ACTIVE',
        vehicleType: vehicleType || null,
        keywords,
        features: Array.isArray(features) ? features : [],
        sidewallCategory: sidewallCategory || null,
        sidewallDetail,
        publishStatus: publishStatus || 'PUBLISHED',
        
        sources: {
          connect: sourceIds ? sourceIds.map((id: string) => ({ id })) : [],
        },
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        sources: true,
      },
    });

    return NextResponse.json(newTire);
  } catch (error) {
    console.error('Error creating tire:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
