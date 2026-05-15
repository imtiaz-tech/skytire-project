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
      publishStatus,
    } = body;

    // Get current sources to handle disconnects
    const currentTire = await prisma.tire.findUnique({
      where: { id },
      include: { sources: true },
    });

    if (!currentTire) {
      return NextResponse.json({ error: 'Tire not found' }, { status: 404 });
    }

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
      if (!sourceIds || !Array.isArray(sourceIds) || sourceIds.length === 0) {
        return NextResponse.json({ error: 'Inventory Source is required' }, { status: 400 });
      }
      
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

    const updatedTire = await prisma.tire.update({
      where: { id },
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
