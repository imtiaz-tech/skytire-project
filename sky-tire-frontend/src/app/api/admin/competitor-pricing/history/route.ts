import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Records created within this window are treated as one bulk update batch */
const BATCH_WINDOW_MS = 3000;

/**
 * Price Match Summary — current match only (NOT full audit history).
 *
 * Rules:
 * 1. Look at updates of the selected type inside the date range
 * 2. Take the most recent update batch only (latest createdAt window)
 * 3. One product = one row within that batch
 * 4. Ignore no-op rows (previousPrice === updatedPrice)
 * 5. Older history stays in the DB but is not shown
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
      // Parse as local calendar date (YYYY-MM-DD from <input type="date">)
      const [y, m, d] = startDate.split('-').map(Number);
      dateFilter.gte = new Date(y, m - 1, d, 0, 0, 0, 0);
    }
    if (endDate) {
      const [y, m, d] = endDate.split('-').map(Number);
      dateFilter.lte = new Date(y, m - 1, d, 23, 59, 59, 999);
    }

    // Newest first within date range
    const rowsInRange = await prisma.competitorPriceUpdate.findMany({
      where: {
        priceType,
        ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Drop no-op history (same previous and updated price)
    const meaningful = rowsInRange.filter(
      (r) => Number(r.previousPrice) !== Number(r.updatedPrice)
    );

    if (meaningful.length === 0) {
      return NextResponse.json({
        products: [],
        type: selectedType,
        total: 0,
      });
    }

    // Current batch = most recent update time ± few seconds
    const latestTime = meaningful[0].createdAt.getTime();
    const currentBatch = meaningful.filter(
      (r) => latestTime - r.createdAt.getTime() <= BATCH_WINDOW_MS
    );

    // One product = one row (first/newest in batch)
    const latestByProduct = new Map<string, (typeof currentBatch)[number]>();
    for (const row of currentBatch) {
      if (!latestByProduct.has(row.productId)) {
        latestByProduct.set(row.productId, row);
      }
    }

    const productIds = [...latestByProduct.keys()];

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

    const products = productIds.map((productId) => {
      const tire = tireMap.get(productId);
      const latest = latestByProduct.get(productId)!;
      const brand = tire?.model?.brand?.brandName || latest.brand || '';
      const model = tire?.model?.modelName || latest.model || '';
      const size = tire?.tireSize || '';
      const productName =
        tire
          ? `${brand} ${model}${size ? ` ${size}` : ''}`.trim()
          : latest.productName || `${brand} ${model}`.trim();

      return {
        productId,
        sku: tire?.sku || latest.sku || '',
        brand,
        model,
        productName,
        cost: tire?.cost ?? latest.cost ?? 0,
        salePrice: tire?.salePrice ?? latest.salePrice ?? 0,
        mapPrice: tire?.mapPrice ?? latest.mapPrice ?? 0,
        regularPrice: tire?.regularPrice ?? latest.regularPrice ?? 0,
        stock: tire?.stock ?? latest.stock ?? 0,
        priceHistory: [
          {
            id: latest.id,
            type: latest.priceType === 'REGULAR' ? 'regular' : 'sale',
            previousPrice: latest.previousPrice,
            updatedPrice: latest.updatedPrice,
            competitor: (latest.competitor || '').toLowerCase(),
            updatedAt: latest.createdAt.toISOString(),
          },
        ],
      };
    });

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
