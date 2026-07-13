import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Lean tire list for competitor pricing matching.
 * Supports optional search + high limit for full catalog load.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50000', 10);
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { tireSize: { contains: search, mode: 'insensitive' } },
        { model: { modelName: { contains: search, mode: 'insensitive' } } },
        { model: { brand: { brandName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [tires, total] = await Promise.all([
      prisma.tire.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          sku: true,
          tireSize: true,
          cost: true,
          internalShipping: true,
          processingAmount: true,
          netCost: true,
          salePrice: true,
          regularPrice: true,
          mapPrice: true,
          stock: true,
          updatedAt: true,
          model: {
            select: {
              modelName: true,
              brand: { select: { brandName: true } },
            },
          },
        },
        orderBy: { sku: 'asc' },
      }),
      prisma.tire.count({ where }),
    ]);

    const products = tires.map((t) => {
      const brand = t.model?.brand?.brandName || '';
      const model = t.model?.modelName || '';
      return {
        id: t.id,
        sku: t.sku || '',
        brand,
        model,
        productName: `${brand} ${model}`.trim(),
        tireSize: t.tireSize || '',
        cost: t.cost ?? 0,
        shipping: t.internalShipping ?? 0,
        financeCost: t.processingAmount ?? 0,
        netCost: t.netCost ?? 0,
        salePrice: t.salePrice ?? 0,
        regularPrice: t.regularPrice ?? 0,
        mapPrice: t.mapPrice ?? 0,
        stock: t.stock ?? 0,
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Error fetching competitor pricing products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
