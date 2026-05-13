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
            { sku: { contains: search, mode: 'insensitive' as const } },
            { tireSize: { tireSize: { contains: search, mode: 'insensitive' as const } } },
            { tireSize: { model: { modelName: { contains: search, mode: 'insensitive' as const } } } },
            { tireSize: { model: { brand: { brandName: { contains: search, mode: 'insensitive' as const } } } } },
          ],
        }
      : {};

    const [tires, total] = await Promise.all([
      prisma.tire.findMany({
        where,
        skip,
        take: limit,
        include: {
          tireSize: {
            include: {
              model: {
                include: {
                  brand: true,
                },
              },
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
      tireSizeId,
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
      sourceIds, // Array of InventorySource IDs
    } = body;

    if (!tireSizeId || !sku) {
      return NextResponse.json({ error: 'tireSizeId and sku are required' }, { status: 400 });
    }

    const newTire = await prisma.tire.create({
      data: {
        tireSizeId,
        sku,
        alternatePartNumber,
        upcNo,
        stock: parseInt(stock) || 0,
        cost: parseFloat(cost) || 0,
        salePrice: parseFloat(salePrice) || 0,
        regularPrice: parseFloat(regularPrice) || 0,
        mapPrice: parseFloat(mapPrice) || 0,
        shippingCost: parseFloat(shippingCost) || 0,
        handlingFee: parseFloat(handlingFee) || 0,
        freightCharges: parseFloat(freightCharges) || 0,
        rebateAvailable: !!rebateAvailable,
        mileageScore: parseInt(mileageScore) || 0,
        tractionScore: parseInt(tractionScore) || 0,
        stabilityScore: parseInt(stabilityScore) || 0,
        feedbackScore: parseInt(feedbackScore) || 0,
        sources: {
          connect: sourceIds ? sourceIds.map((id: string) => ({ id })) : [],
        },
      },
      include: {
        tireSize: {
          include: {
            model: {
              include: {
                brand: true,
              },
            },
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
