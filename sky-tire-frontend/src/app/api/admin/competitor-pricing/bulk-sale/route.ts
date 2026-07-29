import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  findCompetitorCatalogByIds,
  parseCompetitorProductType,
  updateCompetitorSalePrice,
  type CompetitorCatalogType,
} from '@/lib/competitorPricingProduct.server';

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
    const valid: SaleUpdateItem[] = [];

    for (const item of updates) {
      const productId = String(item.productId || '').trim();
      const salePrice = Number(item.salePrice);
      const product = productMap.get(productId);

      if (!product || !Number.isFinite(salePrice)) {
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
          attemptedSalePrice: salePrice,
          mapPrice: product?.mapPrice ?? 0,
          competitor: (item.competitor || '').toLowerCase(),
          reason: 'Product not found or invalid sale price',
        });
        continue;
      }

      const mapPrice = product.mapPrice ?? 0;
      if (mapPrice > 0 && salePrice < mapPrice) {
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
      priceType: 'SALE';
    }> = [];

    for (const item of valid) {
      const product = productMap.get(item.productId)!;
      const brand = product.brand || '';
      const model = product.model || '';
      const size = product.tireSize || '';
      const productName = `${brand} ${model}${size ? ` ${size}` : ''}`.trim();
      const previousPrice = product.salePrice ?? 0;

      if (Number(previousPrice) === Number(item.salePrice)) {
        continue;
      }

      await updateCompetitorSalePrice(productType, item.productId, item.salePrice);

      historyRows.push({
        productId: item.productId,
        productType,
        sku: product.sku,
        brand,
        model,
        productName,
        cost: product.cost ?? 0,
        salePrice: item.salePrice,
        mapPrice: product.mapPrice ?? 0,
        regularPrice: product.regularPrice ?? 0,
        stock: product.stock ?? 0,
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
