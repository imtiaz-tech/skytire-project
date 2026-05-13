import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    const tireSizes = await prisma.tireSize.findMany({
      where: modelId ? { modelId } : {},
      select: {
        id: true,
        tireSize: true,
        tireWidth: true,
        aspectRatio: true,
        rimDiameter: true,
        loadIndex: true,
        speedRating: true,
        loadRange: true,
        inflationPressure: true,
        tireWeight: true,
        shippingDimensions: true,
        utqg: true,
        vehicleType: true,
        sidewallCategory: true,
        sidewallDetail: true,
        status: true,
        keywords: true,
        seoTitle: true,
        metaDescription: true,
      },
      orderBy: {
        tireSize: 'asc',
      },
    });

    return NextResponse.json(tireSizes);
  } catch (error) {
    console.error('Error fetching tire sizes for dropdown:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
