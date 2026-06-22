import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidShippingCategory } from '@/lib/shippingValidation';
import { ShippingCategory } from '@/redux/types/shippingTypes';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || '';
  const size = (searchParams.get('size') || '').trim();
  const accessoryCategoryId = searchParams.get('accessoryCategoryId') || '';
  const accessoryCategoryName = (searchParams.get('accessoryCategoryName') || '').trim();

  if (!isValidShippingCategory(category)) {
    return NextResponse.json({ error: 'Valid category is required' }, { status: 400 });
  }

  try {
    if (category === 'ACCESSORY') {
      if (!accessoryCategoryId && !accessoryCategoryName) {
        return NextResponse.json({ error: 'Accessory category is required' }, { status: 400 });
      }

      const shipping = await prisma.shipping.findFirst({
        where: {
          category: 'ACCESSORY',
          accessoryCategory: accessoryCategoryId
            ? { id: accessoryCategoryId }
            : { name: { equals: accessoryCategoryName, mode: 'insensitive' } },
        },
      });

      if (!shipping) {
        return NextResponse.json(null);
      }

      return NextResponse.json({
        weight: shipping.weight,
        length: shipping.length,
        width: shipping.width,
        height: shipping.height,
        shippingRate: shipping.shippingRate,
      });
    }

    if (!size) {
      return NextResponse.json({ error: 'Size is required' }, { status: 400 });
    }

    const shipping = await prisma.shipping.findFirst({
      where: {
        category: category as ShippingCategory,
        size: { equals: size, mode: 'insensitive' },
      },
    });

    if (!shipping) {
      return NextResponse.json(null);
    }

    return NextResponse.json({
      weight: shipping.weight,
      length: shipping.length,
      width: shipping.width,
      height: shipping.height,
      shippingRate: shipping.shippingRate,
    });
  } catch (error) {
    console.error('Error looking up shipping record:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
