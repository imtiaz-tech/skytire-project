import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializePromoBar } from '@/lib/promoBarValidation';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const existing = await prisma.promoBar.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      return NextResponse.json({ error: 'Invalid promo bar ids' }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.promoBar.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    const promoBars = await prisma.promoBar.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ promoBars: promoBars.map(serializePromoBar) });
  } catch (error) {
    console.error('Error reordering promo bars:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
