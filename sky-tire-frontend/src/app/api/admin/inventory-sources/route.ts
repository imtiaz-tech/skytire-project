import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const sources = await prisma.inventorySource.findMany({
      orderBy: {
        source: 'asc',
      },
    });
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching inventory sources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { source } = await request.json();

    if (!source) {
      return NextResponse.json({ error: 'Source name is required' }, { status: 400 });
    }

    const newSource = await prisma.inventorySource.create({
      data: { source },
    });

    return NextResponse.json(newSource);
  } catch (error) {
    console.error('Error creating inventory source:', error);
    if ((error as any).code === 'P2002') {
      return NextResponse.json({ error: 'Source already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
