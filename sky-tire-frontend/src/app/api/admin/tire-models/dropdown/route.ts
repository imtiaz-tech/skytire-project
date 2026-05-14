import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log('GET /api/admin/tire-models/dropdown hit');
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

    console.log(`Found ${models.length} models for dropdown`);
    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching tire models dropdown:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
