import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  resolvePriceMatchProducts,
  ResolvedPriceMatchProduct,
} from '@/lib/priceMatchProduct.server';
import { PriceMatchProductType } from '@prisma/client';

async function findProductRefsBySearch(search: string) {
  const refs: { productId: string; productType: PriceMatchProductType }[] = [];

  const [tires, wheels, wireWheels, boltOnWheels, accessories] = await Promise.all([
    prisma.tire.findMany({
      where: {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { tireSize: { contains: search, mode: 'insensitive' } },
          { model: { modelName: { contains: search, mode: 'insensitive' } } },
          { model: { brand: { brandName: { contains: search, mode: 'insensitive' } } } },
        ],
      },
      select: { id: true },
      take: 50,
    }),
    prisma.wheel.findMany({
      where: {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { brand: { brandName: { contains: search, mode: 'insensitive' } } },
        ],
      },
      select: { id: true },
      take: 50,
    }),
    prisma.wireWheel.findMany({
      where: {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { brandName: { contains: search, mode: 'insensitive' } } },
        ],
      },
      select: { id: true },
      take: 50,
    }),
    prisma.boltOnWireWheel.findMany({
      where: {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
          { brand: { brandName: { contains: search, mode: 'insensitive' } } },
        ],
      },
      select: { id: true },
      take: 50,
    }),
    prisma.accessory.findMany({
      where: {
        OR: [
          { sku: { contains: search, mode: 'insensitive' } },
          { productName: { contains: search, mode: 'insensitive' } },
          { brand: { brandName: { contains: search, mode: 'insensitive' } } },
        ],
      },
      select: { id: true },
      take: 50,
    }),
  ]);

  tires.forEach((t) => refs.push({ productId: t.id, productType: 'TIRE' }));
  wheels.forEach((w) => refs.push({ productId: w.id, productType: 'WHEEL' }));
  wireWheels.forEach((w) => refs.push({ productId: w.id, productType: 'WIRE_WHEEL' }));
  boltOnWheels.forEach((w) => refs.push({ productId: w.id, productType: 'BOLT_ON_WIRE_WHEEL' }));
  accessories.forEach((a) => refs.push({ productId: a.id, productType: 'ACCESSORY' }));

  return refs;
}

function serializeQuery(
  query: {
    id: string;
    productId: string;
    productType: PriceMatchProductType;
    competitorURL: string;
    competitor: string;
    competitorPrice: string;
    fullName: string;
    email: string;
    phone: string;
    zipCode: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
  product: ResolvedPriceMatchProduct | null
) {
  return {
    ...query,
    createdAt: query.createdAt.toISOString(),
    updatedAt: query.updatedAt.toISOString(),
    product: product
      ? {
          productId: product.productId,
          productType: product.productType,
          productName: product.productName,
          brandName: product.brandName,
          modelName: product.modelName,
          tireSize: product.tireSize,
          salePrice: product.salePrice,
          images: product.images,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  try {
    let where: Record<string, unknown> = {};

    if (search) {
      const productRefs = await findProductRefsBySearch(search);
      const productConditions = productRefs.map((ref) => ({
        productId: ref.productId,
        productType: ref.productType,
      }));

      where = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { competitor: { contains: search, mode: 'insensitive' } },
          { competitorPrice: { contains: search, mode: 'insensitive' } },
          { competitorURL: { contains: search, mode: 'insensitive' } },
          ...(productConditions.length > 0 ? productConditions : []),
        ],
      };
    }

    const needsProductSort = sortBy === 'productName' || sortBy === 'brandName' || sortBy === 'salePrice';

    if (needsProductSort) {
      const allQueries = await prisma.priceMatchQuery.findMany({ where });
      const productMap = await resolvePriceMatchProducts(
        prisma,
        allQueries.map((q) => ({ productId: q.productId, productType: q.productType }))
      );

      const enriched = allQueries.map((query) => {
        const product = productMap.get(`${query.productType}:${query.productId}`) ?? null;
        return { query, product };
      });

      enriched.sort((a, b) => {
        let aVal = '';
        let bVal = '';
        if (sortBy === 'productName') {
          aVal = a.product?.productName ?? '';
          bVal = b.product?.productName ?? '';
        } else if (sortBy === 'brandName') {
          aVal = a.product?.brandName ?? '';
          bVal = b.product?.brandName ?? '';
        } else if (sortBy === 'salePrice') {
          return sortOrder === 'asc'
            ? (a.product?.salePrice ?? 0) - (b.product?.salePrice ?? 0)
            : (b.product?.salePrice ?? 0) - (a.product?.salePrice ?? 0);
        }
        const cmp = aVal.localeCompare(bVal);
        return sortOrder === 'asc' ? cmp : -cmp;
      });

      const total = enriched.length;
      const pages = Math.ceil(total / limit) || 1;
      const skip = (page - 1) * limit;
      const paged = enriched.slice(skip, skip + limit);

      return NextResponse.json({
        queries: paged.map(({ query, product }) => serializeQuery(query, product)),
        total,
        pages,
        currentPage: page,
      });
    }

    const directSortFields = ['createdAt', 'fullName', 'competitor', 'competitorPrice'] as const;
    const orderField = directSortFields.includes(sortBy as (typeof directSortFields)[number])
      ? sortBy
      : 'createdAt';

    const skip = (page - 1) * limit;
    const [queries, total] = await Promise.all([
      prisma.priceMatchQuery.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: sortOrder },
      }),
      prisma.priceMatchQuery.count({ where }),
    ]);

    const productMap = await resolvePriceMatchProducts(
      prisma,
      queries.map((q) => ({ productId: q.productId, productType: q.productType }))
    );

    const pages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      queries: queries.map((query) => {
        const product = productMap.get(`${query.productType}:${query.productId}`) ?? null;
        return serializeQuery(query, product);
      }),
      total,
      pages,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching price match queries:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
