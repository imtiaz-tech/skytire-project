import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RegularUpdateItem {
  productId: string;
  regularPrice: number;
  competitor?: string;
}

/**
 * Bulk regular price update.
 * Skips products where Regular Price <= Current Sale Price.
 * Logs successful updates to CompetitorPriceUpdate history.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = (body?.updates || []) as RegularUpdateItem[];

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const ids = updates.map((u) => String(u.productId).trim()).filter(Boolean);
    const tires = await prisma.tire.findMany({
      where: { id: { in: ids } },
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
    const skipped: Array<Record<string, unknown>> = [];
    const valid: RegularUpdateItem[] = [];

    for (const item of updates) {
      const productId = String(item.productId || '').trim();
      const regularPrice = Number(item.regularPrice);
      const tire = tireMap.get(productId);

      if (!tire || !Number.isFinite(regularPrice)) {
        const brand = tire?.model?.brand?.brandName || '';
        const model = tire?.model?.modelName || '';
        const size = tire?.tireSize || '';
        skipped.push({
          productId,
          sku: tire?.sku || productId,
          brand,
          model,
          productName: `${brand} ${model}${size ? ` ${size}` : ''}`.trim(),
          currentSalePrice: tire?.salePrice ?? 0,
          currentRegularPrice: tire?.regularPrice ?? 0,
          attemptedRegularPrice: regularPrice,
          mapPrice: tire?.mapPrice ?? 0,
          competitor: (item.competitor || '').toLowerCase(),
          reason: 'Product not found or invalid regular price',
        });
        continue;
      }

      if (regularPrice <= tire.salePrice) {
        const brand = tire.model?.brand?.brandName || '';
        const model = tire.model?.modelName || '';
        const size = tire.tireSize || '';
        skipped.push({
          productId,
          sku: tire.sku || '',
          brand,
          model,
          productName: `${brand} ${model}${size ? ` ${size}` : ''}`.trim(),
          currentSalePrice: tire.salePrice,
          currentRegularPrice: tire.regularPrice,
          attemptedRegularPrice: regularPrice,
          mapPrice: tire.mapPrice,
          competitor: (item.competitor || '').toLowerCase(),
          reason: 'Regular Price <= Sale Price',
        });
        continue;
      }

      valid.push({
        productId,
        regularPrice: Math.round(regularPrice * 100) / 100,
        competitor: item.competitor,
      });
    }

    let updated = 0;
    const historyRows: Array<{
      productId: string;
      sku: string | null;
      brand: string;
      model: string;
      productName: string;
      cost: number;
      salePrice: number;
      mapPrice: number;
      regularPrice: number;
      stock: number;
      previousPrice: number;
      updatedPrice: number;
      competitor: string;
      priceType: 'REGULAR';
    }> = [];

    for (const item of valid) {
      const tire = tireMap.get(item.productId)!;
      const brand = tire.model?.brand?.brandName || '';
      const model = tire.model?.modelName || '';
      const size = tire.tireSize || '';
      const productName = `${brand} ${model}${size ? ` ${size}` : ''}`.trim();
      const previousPrice = tire.regularPrice ?? 0;

      // Skip no-op updates (same price)
      if (Number(previousPrice) === Number(item.regularPrice)) {
        continue;
      }

      await prisma.tire.update({
        where: { id: item.productId },
        data: { regularPrice: item.regularPrice },
      });

      historyRows.push({
        productId: item.productId,
        sku: tire.sku,
        brand,
        model,
        productName,
        cost: tire.cost ?? 0,
        salePrice: tire.salePrice ?? 0,
        mapPrice: tire.mapPrice ?? 0,
        regularPrice: item.regularPrice,
        stock: tire.stock ?? 0,
        previousPrice,
        updatedPrice: item.regularPrice,
        competitor: (item.competitor || '').toLowerCase(),
        priceType: 'REGULAR',
      });
      updated++;
    }

    if (historyRows.length > 0) {
      await prisma.competitorPriceUpdate.createMany({ data: historyRows });
    }

    return NextResponse.json({
      message: `Updated ${updated} regular prices`,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Error bulk updating regular prices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
