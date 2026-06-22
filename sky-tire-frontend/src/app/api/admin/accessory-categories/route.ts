import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureDefaultAccessoryCategories } from '@/lib/accessoryCategorySeed';

export async function GET() {
  try {
    await ensureDefaultAccessoryCategories();

    const categories = await prisma.accessoryCategory.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching accessory categories:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name as string)?.trim();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const existing = await prisma.accessoryCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    const category = await prisma.accessoryCategory.create({
      data: { name },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating accessory category:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
