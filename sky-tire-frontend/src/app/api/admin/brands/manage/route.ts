import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all brands for a given category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'wire_wheel';

    const brands = await prisma.brand.findMany({
      where: { category: category as any },
      select: {
        id: true,
        brandName: true,
        category: true,
      },
      orderBy: { brandName: 'asc' },
    });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new brand (simplified — no logo required from modal)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, category } = body;

    if (!brandName) {
      return NextResponse.json({ message: 'Brand name is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ message: 'Category is required' }, { status: 400 });
    }

    const newBrand = await prisma.brand.create({
      data: {
        brandName,
        category: category as any,
        brandLogo: 'placeholder-brand-logo.png',
      },
    });

    return NextResponse.json(newBrand);
  } catch (error: any) {
    console.error('Error creating brand:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ message: 'Brand already exists' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
