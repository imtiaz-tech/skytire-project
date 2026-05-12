import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    const { source } = await request.json();
    
    if (!source) {
      return NextResponse.json({ error: 'Source name is required' }, { status: 400 });
    }

    const updatedSource = await prisma.inventorySource.update({
      where: { id },
      data: { source },
    });

    return NextResponse.json(updatedSource);
  } catch (error) {
    console.error('Error updating inventory source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  try {
    await prisma.inventorySource.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Source deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory source:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
