import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const models = await prisma.tireModel.findMany({
      select: {
        id: true,
        modelName: true,
        brand: {
          select: {
            brandName: true,
          },
        },
      },
      orderBy: {
        modelName: 'asc',
      },
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching tire models dropdown:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
