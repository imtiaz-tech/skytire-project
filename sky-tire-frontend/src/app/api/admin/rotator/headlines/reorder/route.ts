import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeRotatorHeadline } from '@/lib/rotatorValidation';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];

    if (ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const existing = await prisma.rotatorHeadline.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });

    if (existing.length !== ids.length) {
      return NextResponse.json({ error: 'Invalid headline ids' }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.rotatorHeadline.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    const headlines = await prisma.rotatorHeadline.findMany({ orderBy: { order: 'asc' } });
    return NextResponse.json({ headlines: headlines.map(serializeRotatorHeadline) });
  } catch (error) {
    console.error('Error reordering rotator headlines:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
