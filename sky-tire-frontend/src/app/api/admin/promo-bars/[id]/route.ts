import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildPromoBarData,
  serializePromoBar,
  validatePromoBarInput,
} from '@/lib/promoBarValidation';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const promoBar = await prisma.promoBar.findUnique({ where: { id } });
    if (!promoBar) {
      return NextResponse.json({ error: 'Promo bar not found' }, { status: 404 });
    }
    return NextResponse.json(serializePromoBar(promoBar));
  } catch (error) {
    console.error('Error fetching promo bar:', error);
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
    const validationError = validatePromoBarInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const promoBar = await prisma.promoBar.update({
      where: { id },
      data: buildPromoBarData(body),
    });

    return NextResponse.json(serializePromoBar(promoBar));
  } catch (error) {
    console.error('Error updating promo bar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive is required' }, { status: 400 });
    }

    const promoBar = await prisma.promoBar.update({
      where: { id },
      data: { isActive: body.isActive },
    });

    return NextResponse.json(serializePromoBar(promoBar));
  } catch (error) {
    console.error('Error patching promo bar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.promoBar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting promo bar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
