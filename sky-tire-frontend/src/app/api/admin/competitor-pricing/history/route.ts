import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Price Match Summary data:
 * - Find products that had a price match of the given type within the date range
 * - Return each product with CURRENT pricing fields + COMPLETE priceHistory
 * - Frontend picks only the latest history entry for display/CSV
 * - Old history is never deleted or overwritten
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const typeParam = (searchParams.get('type') || 'sale').toLowerCase();
  const priceType = typeParam === 'regular' ? 'REGULAR' : 'SALE';
  const selectedType = typeParam === 'regular' ? 'regular' : 'sale';

  try {
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    // Products that had at least one update of this type in the date range
    const matchedInRange = await prisma.competitorPriceUpdate.findMany({
      where: {
        priceType,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      select: { productId: true },
      distinct: ['productId'],
    });

    const productIds = matchedInRange.map((r) => r.productId);
    if (productIds.length === 0) {
      return NextResponse.json({
        products: [],
        type: selectedType,
        total: 0,
      });
    }

    // Complete history for those products (same type) — do not trim to latest here
    const allHistory = await prisma.competitorPriceUpdate.findMany({
      where: {
        productId: { in: productIds },
        priceType,
      },
      orderBy: { createdAt: 'desc' },
    });

    const historyByProduct = new Map<string, typeof allHistory>();
    for (const row of allHistory) {
      const list = historyByProduct.get(row.productId);
      if (list) list.push(row);
      else historyByProduct.set(row.productId, [row]);
    }

    // Current product snapshot from Tire table
    const tires = await prisma.tire.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        sku: true,
        tireSize: true,
        cost: true,
        salePrice: true,
        regularPrice: true,
        mapPrice: true,
        stock: true,
        model: {
          select: {
            modelName: true,
            brand: { select: { brandName: true } },
          },
        },
      },
    });

    const tireMap = new Map(tires.map((t) => [t.id, t]));

    const products = productIds
      .map((productId) => {
        const tire = tireMap.get(productId);
        const historyRows = historyByProduct.get(productId) || [];
        // Prefer live tire data; fall back to last history snapshot for missing tires
        const fallback = historyRows[0];
        const brand =
          tire?.model?.brand?.brandName || fallback?.brand || '';
        const model = tire?.model?.modelName || fallback?.model || '';
        const size = tire?.tireSize || '';
        const productName =
          tire
            ? `${brand} ${model}${size ? ` ${size}` : ''}`.trim()
            : fallback?.productName || `${brand} ${model}`.trim();

        return {
          productId,
          sku: tire?.sku || fallback?.sku || '',
          brand,
          model,
          productName,
          cost: tire?.cost ?? fallback?.cost ?? 0,
          salePrice: tire?.salePrice ?? fallback?.salePrice ?? 0,
          mapPrice: tire?.mapPrice ?? fallback?.mapPrice ?? 0,
          regularPrice: tire?.regularPrice ?? fallback?.regularPrice ?? 0,
          stock: tire?.stock ?? fallback?.stock ?? 0,
          priceHistory: historyRows.map((h) => ({
            id: h.id,
            type: h.priceType === 'REGULAR' ? 'regular' : 'sale',
            previousPrice: h.previousPrice,
            updatedPrice: h.updatedPrice,
            competitor: (h.competitor || '').toLowerCase(),
            updatedAt: h.createdAt.toISOString(),
          })),
        };
      })
      .filter((p) => p.priceHistory.length > 0);

    return NextResponse.json({
      products,
      type: selectedType,
      total: products.length,
    });
  } catch (error) {
    console.error('Error fetching price update history:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
