import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = await prisma.inventorySource.findUnique({
      where: { id },
    });

    if (!source) {
      return NextResponse.json({ error: 'Inventory Source not found' }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error) {
    console.error('Error fetching inventory source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { source } = body;

    if (!source) {
      return NextResponse.json({ error: 'Source name is required' }, { status: 400 });
    }

    const updatedSource = await prisma.inventorySource.update({
      where: { id },
      data: {
        source,
      },
    });

    return NextResponse.json(updatedSource);
  } catch (error: any) {
    console.error('Error updating inventory source:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Inventory Source already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // 1. Find all tire IDs linked to this source (updateMany doesn't support relation filters)
      const linkedTires = await tx.tire.findMany({
        where: { sources: { some: { id } } },
        select: { id: true },
      });
      const tireIds = linkedTires.map((t) => t.id);

      if (tireIds.length > 0) {
        await tx.tire.updateMany({
          where: { id: { in: tireIds } },
          data: { stock: 0 },
        });
      }

      // 2. Find all wheel IDs linked to this source
      const linkedWheels = await tx.wheel.findMany({
        where: { sources: { some: { id } } },
        select: { id: true },
      });
      const wheelIds = linkedWheels.map((w) => w.id);

      if (wheelIds.length > 0) {
        await tx.wheel.updateMany({
          where: { id: { in: wheelIds } },
          data: { stock: 0 },
        });
      }

      // 3. Reset stock to 0 and remove source link for wire wheels
      await tx.wireWheel.updateMany({
        where: { sourceId: id },
        data: { stock: 0, sourceId: null },
      });

      // 4. Delete the inventory source
      await tx.inventorySource.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Inventory Source deleted successfully and linked tires/wheels/wire-wheels stock reset to 0' });
  } catch (error) {
    console.error('Error deleting inventory source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
