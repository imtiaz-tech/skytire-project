import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    const tire = await prisma.tire.findUnique({
      where: { id },
      include: {
        model: {
          include: {
            brand: true,
          },
        },
        sources: true,
      },
    });

    if (!tire) {
      return NextResponse.json({ error: 'Tire not found' }, { status: 404 });
    }

    return NextResponse.json(tire);
  } catch (error) {
    console.error('Error fetching tire:', error);
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
    } = body;

    // Get current sources to handle disconnects
    const currentTire = await prisma.tire.findUnique({
      where: { id },
      include: { sources: true },
    });

    if (!currentTire) {
      return NextResponse.json({ error: 'Tire not found' }, { status: 404 });
    }

    const regularNum = parseFloat(regularPrice) || 0;
    const saleNum = parseFloat(salePrice) || 0;
    const mapNum = parseFloat(mapPrice) || 0;

    if (regularNum > 0 && regularNum <= saleNum) {
      return NextResponse.json({ error: 'Regular Price must be greater than Sale Price' }, { status: 400 });
    }
    if (mapNum > 0 && saleNum < mapNum) {
      return NextResponse.json({ error: 'Sale Price must be greater than or equal to MAP Price' }, { status: 400 });
    }

    const updatedTire = await prisma.tire.update({
      where: { id },
      data: {
        modelId,
        sku,
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
        status: status || 'ACTIVE',
        vehicleType,
        keywords,
        features: Array.isArray(features) ? features : [],
        sidewallCategory,
        sidewallDetail,

        sources: {
          set: sourceIds ? sourceIds.map((id: string) => ({ id })) : [],
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

    return NextResponse.json(updatedTire);
  } catch (error) {
    console.error('Error updating tire:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    await prisma.tire.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Tire deleted successfully' });
  } catch (error) {
    console.error('Error deleting tire:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
