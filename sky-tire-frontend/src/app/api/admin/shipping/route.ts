import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildShippingSearchWhere,
  isValidShippingCategory,
  validateShippingInput,
} from '@/lib/shippingValidation';
import { ShippingCategory } from '@/redux/types/shippingTypes';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';

  if (!isValidShippingCategory(category)) {
    return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
  }

  const skip = (page - 1) * limit;

  try {
    const where = buildShippingSearchWhere(category as ShippingCategory, search);

    const [shippings, total] = await Promise.all([
      prisma.shipping.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shipping.count({ where }),
    ]);

    const pages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      shippings,
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching shipping records:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateShippingInput(body);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join(', ') }, { status: 400 });
    }

    const { category, size, weight, length, width, height, shippingRate } = validation.data;

    const existing = await prisma.shipping.findUnique({
      where: {
        category_size: { category, size },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Size "${size}" already exists for this category` },
        { status: 400 },
      );
    }

    const shipping = await prisma.shipping.create({
      data: {
        category,
        size,
        weight,
        length,
        width,
        height,
        shippingRate,
      },
    });

    return NextResponse.json(shipping, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating shipping record:', error);
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Size already exists for this category' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
