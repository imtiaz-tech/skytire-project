import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tireSizes = await prisma.tireSize.findMany({
      include: {
        model: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        tireSize: 'asc',
      },
    });

    return NextResponse.json(tireSizes);
  } catch (error) {
    console.error('Error fetching tire sizes dropdown:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
