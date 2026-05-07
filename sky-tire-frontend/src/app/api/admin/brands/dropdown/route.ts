import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        category: 'tire',
      },
      select: {
        id: true,
        brandName: true,
      },
      orderBy: {
        brandName: 'asc',
      },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands dropdown:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
