import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  findCompetitorCatalogByIds,
  parseCompetitorProductType,
  updateCompetitorRegularPrice,
  type CompetitorCatalogType,
} from '@/lib/competitorPricingProduct.server';

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
    const productType: CompetitorCatalogType = parseCompetitorProductType(
      body?.productType
    );

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const ids = updates.map((u) => String(u.productId).trim()).filter(Boolean);
    const products = await findCompetitorCatalogByIds(productType, ids);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const skipped: Array<Record<string, unknown>> = [];
    const valid: RegularUpdateItem[] = [];

    for (const item of updates) {
      const productId = String(item.productId || '').trim();
      const regularPrice = Number(item.regularPrice);
      const product = productMap.get(productId);

      if (!product || !Number.isFinite(regularPrice)) {
        const brand = product?.brand || '';
        const model = product?.model || '';
        const size = product?.tireSize || '';
        skipped.push({
          productId,
          sku: product?.sku || productId,
          brand,
          model,
          productName: `${brand} ${model}${size ? ` ${size}` : ''}`.trim(),
          currentSalePrice: product?.salePrice ?? 0,
          currentRegularPrice: product?.regularPrice ?? 0,
          attemptedRegularPrice: regularPrice,
          mapPrice: product?.mapPrice ?? 0,
          competitor: (item.competitor || '').toLowerCase(),
          reason: 'Product not found or invalid regular price',
        });
        continue;
      }

      if (regularPrice <= product.salePrice) {
        const brand = product.brand || '';
        const model = product.model || '';
        const size = product.tireSize || '';
        skipped.push({
          productId,
          sku: product.sku || '',
          brand,
          model,
          productName: `${brand} ${model}${size ? ` ${size}` : ''}`.trim(),
          currentSalePrice: product.salePrice,
          currentRegularPrice: product.regularPrice,
          attemptedRegularPrice: regularPrice,
          mapPrice: product.mapPrice,
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
      productType: string;
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
      const product = productMap.get(item.productId)!;
      const brand = product.brand || '';
      const model = product.model || '';
      const size = product.tireSize || '';
      const productName = `${brand} ${model}${size ? ` ${size}` : ''}`.trim();
      const previousPrice = product.regularPrice ?? 0;

      if (Number(previousPrice) === Number(item.regularPrice)) {
        continue;
      }

      await updateCompetitorRegularPrice(productType, item.productId, item.regularPrice);

      historyRows.push({
        productId: item.productId,
        productType,
        sku: product.sku,
        brand,
        model,
        productName,
        cost: product.cost ?? 0,
        salePrice: product.salePrice ?? 0,
        mapPrice: product.mapPrice ?? 0,
        regularPrice: item.regularPrice,
        stock: product.stock ?? 0,
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
