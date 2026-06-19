import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateShippingInput } from '@/lib/shippingValidation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const shipping = await prisma.shipping.findUnique({ where: { id } });

    if (!shipping) {
      return NextResponse.json({ error: 'Shipping record not found' }, { status: 404 });
    }

    return NextResponse.json(shipping);
  } catch (error) {
    console.error('Error fetching shipping record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const existing = await prisma.shipping.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Shipping record not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = validateShippingInput(
      { ...body, category: existing.category },
      true,
    );

    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { size, weight, length, width, height, shippingRate } = validation.data;

    if (size !== existing.size) {
      const duplicate = await prisma.shipping.findUnique({
        where: {
          category_size: { category: existing.category, size },
        },
      });

      if (duplicate && duplicate.id !== id) {
        return NextResponse.json(
          { error: `Size "${size}" already exists for this category` },
          { status: 400 },
        );
      }
    }

    const shipping = await prisma.shipping.update({
      where: { id },
      data: {
        size,
        weight,
        length,
        width,
        height,
        shippingRate,
      },
    });

    return NextResponse.json(shipping);
  } catch (error: unknown) {
    console.error('Error updating shipping record:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Size already exists for this category' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const existing = await prisma.shipping.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: 'Shipping record not found' }, { status: 404 });
    }

    await prisma.shipping.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shipping record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
