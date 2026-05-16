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
    await prisma.inventorySource.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Inventory Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
