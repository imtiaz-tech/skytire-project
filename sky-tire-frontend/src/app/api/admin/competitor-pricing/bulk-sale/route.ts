import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SaleUpdateItem {
  productId: string;
  salePrice: number;
  competitor?: string;
}

/**
 * Bulk sale price update with MAP enforcement.
 * Skips products where competitor sale price < latest MAP price.
 * Logs successful updates to CompetitorPriceUpdate history.
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updates = (body?.updates || []) as SaleUpdateItem[];

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
    const valid: SaleUpdateItem[] = [];

    for (const item of updates) {
      const productId = String(item.productId || '').trim();
      const salePrice = Number(item.salePrice);
      const tire = tireMap.get(productId);

      if (!tire || !Number.isFinite(salePrice)) {
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
          attemptedSalePrice: salePrice,
          mapPrice: tire?.mapPrice ?? 0,
          competitor: (item.competitor || '').toLowerCase(),
          reason: 'Product not found or invalid sale price',
        });
        continue;
      }

      const mapPrice = tire.mapPrice ?? 0;
      if (mapPrice > 0 && salePrice < mapPrice) {
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
          attemptedSalePrice: salePrice,
          mapPrice,
          competitor: (item.competitor || '').toLowerCase(),
          reason: 'Sale Price < MAP Price',
        });
        continue;
      }

      valid.push({
        productId,
        salePrice: Math.round(salePrice * 100) / 100,
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
      priceType: 'SALE';
    }> = [];

    for (const item of valid) {
      const tire = tireMap.get(item.productId)!;
      const brand = tire.model?.brand?.brandName || '';
      const model = tire.model?.modelName || '';
      const size = tire.tireSize || '';
      const productName = `${brand} ${model}${size ? ` ${size}` : ''}`.trim();
      const previousPrice = tire.salePrice ?? 0;

      await prisma.tire.update({
        where: { id: item.productId },
        data: { salePrice: item.salePrice },
      });

      historyRows.push({
        productId: item.productId,
        sku: tire.sku,
        brand,
        model,
        productName,
        cost: tire.cost ?? 0,
        salePrice: item.salePrice,
        mapPrice: tire.mapPrice ?? 0,
        regularPrice: tire.regularPrice ?? 0,
        stock: tire.stock ?? 0,
        previousPrice,
        updatedPrice: item.salePrice,
        competitor: (item.competitor || '').toLowerCase(),
        priceType: 'SALE',
      });
      updated++;
    }

    if (historyRows.length > 0) {
      await prisma.competitorPriceUpdate.createMany({ data: historyRows });
    }

    return NextResponse.json({
      message: `Updated ${updated} sale prices`,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Error bulk updating sale prices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
