import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isDropdown = searchParams.get('dropdown') === 'true';

  if (isDropdown) {
    try {
      const sources = await prisma.inventorySource.findMany({
        orderBy: {
          source: 'asc',
        },
      });
      return NextResponse.json(sources);
    } catch (error) {
      console.error('Error fetching inventory sources dropdown:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';

  const skip = (page - 1) * limit;

  try {
    const where = search
      ? {
          source: { contains: search, mode: 'insensitive' as const },
        }
      : {};

    const [inventorySources, total] = await Promise.all([
      prisma.inventorySource.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.inventorySource.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      inventorySources,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching inventory sources:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source } = body;

    if (!source) {
      return NextResponse.json({ error: 'Source name is required' }, { status: 400 });
    }

    const newSource = await prisma.inventorySource.create({
      data: {
        source,
      },
    });

    return NextResponse.json(newSource);
  } catch (error: any) {
    console.error('Error creating inventory source:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Inventory Source already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
