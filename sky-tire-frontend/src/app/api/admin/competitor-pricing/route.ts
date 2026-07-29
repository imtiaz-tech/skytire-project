import { NextRequest, NextResponse } from 'next/server';
import {
  listCompetitorCatalogProducts,
  parseCompetitorProductType,
} from '@/lib/competitorPricingProduct.server';

/**
 * Lean product list for competitor pricing matching.
 * Supports productType + optional search + high limit for full catalog load.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50000', 10);
  const skip = (page - 1) * limit;
  const productType = parseCompetitorProductType(searchParams.get('productType'));

  try {
    const { products, total } = await listCompetitorCatalogProducts(productType, {
      search,
      skip,
      take: limit,
    });

    return NextResponse.json({
      products,
      total,
      page,
      pages: Math.ceil(total / limit),
      productType,
    });
  } catch (error) {
    console.error('Error fetching competitor pricing products:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
