import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    const tireSize = await prisma.tireSize.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (!tireSize) {
      return NextResponse.json({ error: 'Tire size not found' }, { status: 404 });
    }

    return NextResponse.json(tireSize);
  } catch (error) {
    console.error('Error fetching tire size:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

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
      sidewallCategory,
      sidewallDetail,
    } = body;

    const updatedSize = await prisma.tireSize.update({
      where: { id },
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
        status: status || 'ACTIVE',
        vehicleType: vehicleType || null,
        keywords: keywords || null,
        sidewallCategory: sidewallCategory || null,
        sidewallDetail: sidewallDetail || null,
      },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSize);
  } catch (error) {
    console.error('Error updating tire size:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;

  try {
    await prisma.tireSize.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tire size deleted successfully' });
  } catch (error) {
    console.error('Error deleting tire size:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
