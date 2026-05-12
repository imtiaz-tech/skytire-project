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
      tireSizeId,
      sku,
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

    // Get current sources to handle disconnects
    const currentTire = await prisma.tire.findUnique({
      where: { id },
      include: { sources: true },
    });

    if (!currentTire) {
      return NextResponse.json({ error: 'Tire not found' }, { status: 404 });
    }

    const updatedTire = await prisma.tire.update({
      where: { id },
      data: {
        tireSizeId,
        sku,
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
          set: sourceIds ? sourceIds.map((id: string) => ({ id })) : [],
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
