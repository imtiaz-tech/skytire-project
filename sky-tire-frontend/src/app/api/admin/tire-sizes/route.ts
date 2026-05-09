import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  try {
    const where = search
      ? {
          OR: [
            { tireSize: { contains: search, mode: 'insensitive' as const } },
            { model: { modelName: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [tireSizes, total] = await Promise.all([
      prisma.tireSize.findMany({
        where,
        skip,
        take: limit,
        include: {
          model: {
            include: {
              brand: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.tireSize.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      tireSizes,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching tire sizes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      modelId,
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
      sidewall,
    } = body;

    if (!modelId || !tireSize) {
      return NextResponse.json({ error: 'modelId and tireSize are required' }, { status: 400 });
    }

    const newSize = await prisma.tireSize.create({
      data: {
        modelId,
        tireSize,
        tireWidth: tireWidth || null,
        aspectRatio: aspectRatio || null,
        rimDiameter: rimDiameter || null,
        loadIndex: loadIndex || null,
        speedRating: speedRating || null,
        loadRange: loadRange || null,
        inflationPressure: inflationPressure || null,
        tireWeight: tireWeight || null,
        shippingDimensions: shippingDimensions || null,
        utqg: utqg || null,
        seoTitle: seoTitle || null,
        metaDescription: metaDescription || null,
        status: status || 'active',
        vehicleType: vehicleType || null,
        keywords: keywords || null,
        sidewall: sidewall || null,
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
    });

    return NextResponse.json(newSize);
  } catch (error) {
    console.error('Error creating tire size:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
