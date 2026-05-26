import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT: Update a brand name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { brandName } = body;

    if (!brandName) {
      return NextResponse.json({ message: 'Brand name is required' }, { status: 400 });
    }

    const updatedBrand = await prisma.brand.update({
      where: { id },
      data: { brandName },
    });

    return NextResponse.json(updatedBrand);
  } catch (error: any) {
    console.error('Error updating brand:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Brand name already exists' }, { status: 400 });
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Remove a brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Unlink wire wheels from this brand before deleting
    await prisma.wireWheel.updateMany({
      where: { brandId: id },
      data: { brandId: null },
    });

    // Unlink wheels from this brand
    await prisma.wheel.updateMany({
      where: { brandId: id },
      data: { brandId: null },
    });

    await prisma.brand.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting brand:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Brand not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
