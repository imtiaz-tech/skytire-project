import { prisma } from '@/lib/prisma';

export const COMPETITOR_PRODUCT_TYPES = [
  'TIRE',
  'WHEEL',
  'WIRE_WHEEL',
  'BOLT_ON_WIRE_WHEEL',
  'ACCESSORY',
] as const;

export type CompetitorCatalogType = (typeof COMPETITOR_PRODUCT_TYPES)[number];

export interface CompetitorCatalogProduct {
  id: string;
  sku: string;
  brand: string;
  model: string;
  productName: string;
  tireSize: string;
  cost: number;
  shipping: number;
  financeCost: number;
  netCost: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  stock: number;
  updatedAt: string;
}

export function parseCompetitorProductType(
  value: string | null | undefined
): CompetitorCatalogType {
  const normalized = String(value || 'TIRE').trim().toUpperCase();
  if ((COMPETITOR_PRODUCT_TYPES as readonly string[]).includes(normalized)) {
    return normalized as CompetitorCatalogType;
  }
  return 'TIRE';
}

function mapPricingFields(row: {
  cost?: number | null;
  internalShipping?: number | null;
  processingAmount?: number | null;
  netCost?: number | null;
  salePrice?: number | null;
  regularPrice?: number | null;
  mapPrice?: number | null;
  stock?: number | null;
  updatedAt: Date;
}) {
  return {
    cost: row.cost ?? 0,
    shipping: row.internalShipping ?? 0,
    financeCost: row.processingAmount ?? 0,
    netCost: row.netCost ?? 0,
    salePrice: row.salePrice ?? 0,
    regularPrice: row.regularPrice ?? 0,
    mapPrice: row.mapPrice ?? 0,
    stock: row.stock ?? 0,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Draft products are never priced against competitors */
function notDraftFilter(productType: CompetitorCatalogType): Record<string, unknown> {
  if (productType === 'TIRE') {
    return { publishStatus: { not: 'DRAFT' } };
  }
  return { status: { not: 'draft' } };
}

const pricingSelect = {
  id: true,
  sku: true,
  cost: true,
  internalShipping: true,
  processingAmount: true,
  netCost: true,
  salePrice: true,
  regularPrice: true,
  mapPrice: true,
  stock: true,
  updatedAt: true,
} as const;

export async function listCompetitorCatalogProducts(
  productType: CompetitorCatalogType,
  opts: { search?: string; skip?: number; take?: number } = {}
): Promise<{ products: CompetitorCatalogProduct[]; total: number }> {
  const search = (opts.search || '').trim();
  const skip = opts.skip ?? 0;
  const take = opts.take ?? 50000;

  if (productType === 'TIRE') {
    const where: Record<string, unknown> = { ...notDraftFilter(productType) };
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { tireSize: { contains: search, mode: 'insensitive' } },
        { model: { modelName: { contains: search, mode: 'insensitive' } } },
        { model: { brand: { brandName: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    const [rows, total] = await Promise.all([
      prisma.tire.findMany({
        where,
        skip,
        take,
        select: {
          ...pricingSelect,
          tireSize: true,
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
    return {
      total,
      products: rows.map((t) => {
        const brand = t.model?.brand?.brandName || '';
        const model = t.model?.modelName || '';
        return {
          id: t.id,
          sku: t.sku || '',
          brand,
          model,
          productName: `${brand} ${model}`.trim(),
          tireSize: t.tireSize || '',
          ...mapPricingFields(t),
        };
      }),
    };
  }

  if (productType === 'WHEEL') {
    const where: Record<string, unknown> = { ...notDraftFilter(productType) };
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { productName: { contains: search, mode: 'insensitive' } },
        { wheelSize: { contains: search, mode: 'insensitive' } },
        { brand: { brandName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [rows, total] = await Promise.all([
      prisma.wheel.findMany({
        where,
        skip,
        take,
        select: {
          ...pricingSelect,
          productName: true,
          wheelSize: true,
          brand: { select: { brandName: true } },
        },
        orderBy: { sku: 'asc' },
      }),
      prisma.wheel.count({ where }),
    ]);
    return {
      total,
      products: rows.map((w) => {
        const brand = w.brand?.brandName || '';
        const model = w.productName || '';
        return {
          id: w.id,
          sku: w.sku || '',
          brand,
          model,
          productName: model || `${brand}`.trim(),
          tireSize: w.wheelSize || '',
          ...mapPricingFields(w),
        };
      }),
    };
  }

  if (productType === 'WIRE_WHEEL' || productType === 'BOLT_ON_WIRE_WHEEL') {
    const where: Record<string, unknown> = { ...notDraftFilter(productType) };
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
        { brand: { brandName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const findArgs = {
      where,
      skip,
      take,
      select: {
        ...pricingSelect,
        name: true,
        size: true,
        brand: { select: { brandName: true } },
      },
      orderBy: { sku: 'asc' as const },
    };
    const [rows, total] =
      productType === 'WIRE_WHEEL'
        ? await Promise.all([
            prisma.wireWheel.findMany(findArgs),
            prisma.wireWheel.count({ where }),
          ])
        : await Promise.all([
            prisma.boltOnWireWheel.findMany(findArgs),
            prisma.boltOnWireWheel.count({ where }),
          ]);
    return {
      total,
      products: rows.map((w) => {
        const brand = w.brand?.brandName || '';
        const model = w.name || '';
        return {
          id: w.id,
          sku: w.sku || '',
          brand,
          model,
          productName: model || brand,
          tireSize: w.size || '',
          ...mapPricingFields(w),
        };
      }),
    };
  }

  // ACCESSORY
  const where: Record<string, unknown> = { ...notDraftFilter(productType) };
  if (search) {
    where.OR = [
      { sku: { contains: search, mode: 'insensitive' } },
      { productName: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
      { brand: { brandName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const [rows, total] = await Promise.all([
    prisma.accessory.findMany({
      where,
      skip,
      take,
      select: {
        ...pricingSelect,
        productName: true,
        category: true,
        brand: { select: { brandName: true } },
      },
      orderBy: { sku: 'asc' },
    }),
    prisma.accessory.count({ where }),
  ]);
  return {
    total,
    products: rows.map((a) => {
      const brand = a.brand?.brandName || '';
      const model = a.productName || '';
      return {
        id: a.id,
        sku: a.sku || '',
        brand,
        model,
        productName: model || brand,
        tireSize: a.category || '',
        ...mapPricingFields(a),
      };
    }),
  };
}

export async function findCompetitorCatalogByIds(
  productType: CompetitorCatalogType,
  ids: string[]
): Promise<CompetitorCatalogProduct[]> {
  if (ids.length === 0) return [];
  if (productType === 'TIRE') {
    const rows = await prisma.tire.findMany({
      where: { id: { in: ids }, ...notDraftFilter(productType) },
      select: {
        ...pricingSelect,
        tireSize: true,
        model: {
          select: {
            modelName: true,
            brand: { select: { brandName: true } },
          },
        },
      },
    });
    return rows.map((t) => {
      const brand = t.model?.brand?.brandName || '';
      const model = t.model?.modelName || '';
      return {
        id: t.id,
        sku: t.sku || '',
        brand,
        model,
        productName: `${brand} ${model}`.trim(),
        tireSize: t.tireSize || '',
        ...mapPricingFields(t),
      };
    });
  }
  if (productType === 'WHEEL') {
    const rows = await prisma.wheel.findMany({
      where: { id: { in: ids }, ...notDraftFilter(productType) },
      select: {
        ...pricingSelect,
        productName: true,
        wheelSize: true,
        brand: { select: { brandName: true } },
      },
    });
    return rows.map((w) => {
      const brand = w.brand?.brandName || '';
      const model = w.productName || '';
      return {
        id: w.id,
        sku: w.sku || '',
        brand,
        model,
        productName: model || brand,
        tireSize: w.wheelSize || '',
        ...mapPricingFields(w),
      };
    });
  }
  if (productType === 'WIRE_WHEEL' || productType === 'BOLT_ON_WIRE_WHEEL') {
    const findArgs = {
      where: { id: { in: ids }, ...notDraftFilter(productType) },
      select: {
        ...pricingSelect,
        name: true,
        size: true,
        brand: { select: { brandName: true } },
      },
    };
    const rows =
      productType === 'WIRE_WHEEL'
        ? await prisma.wireWheel.findMany(findArgs)
        : await prisma.boltOnWireWheel.findMany(findArgs);
    return rows.map((w) => {
      const brand = w.brand?.brandName || '';
      const model = w.name || '';
      return {
        id: w.id,
        sku: w.sku || '',
        brand,
        model,
        productName: model || brand,
        tireSize: w.size || '',
        ...mapPricingFields(w),
      };
    });
  }
  const rows = await prisma.accessory.findMany({
    where: { id: { in: ids }, ...notDraftFilter(productType) },
    select: {
      ...pricingSelect,
      productName: true,
      category: true,
      brand: { select: { brandName: true } },
    },
  });
  return rows.map((a) => {
    const brand = a.brand?.brandName || '';
    const model = a.productName || '';
    return {
      id: a.id,
      sku: a.sku || '',
      brand,
      model,
      productName: model || brand,
      tireSize: a.category || '',
      ...mapPricingFields(a),
    };
  });
}

export async function updateCompetitorSalePrice(
  productType: CompetitorCatalogType,
  productId: string,
  salePrice: number
) {
  const data = { salePrice };
  if (productType === 'TIRE') {
    return prisma.tire.update({ where: { id: productId }, data });
  }
  if (productType === 'WHEEL') {
    return prisma.wheel.update({ where: { id: productId }, data });
  }
  if (productType === 'WIRE_WHEEL') {
    return prisma.wireWheel.update({ where: { id: productId }, data });
  }
  if (productType === 'BOLT_ON_WIRE_WHEEL') {
    return prisma.boltOnWireWheel.update({ where: { id: productId }, data });
  }
  return prisma.accessory.update({ where: { id: productId }, data });
}

export async function updateCompetitorRegularPrice(
  productType: CompetitorCatalogType,
  productId: string,
  regularPrice: number
) {
  const data = { regularPrice };
  if (productType === 'TIRE') {
    return prisma.tire.update({ where: { id: productId }, data });
  }
  if (productType === 'WHEEL') {
    return prisma.wheel.update({ where: { id: productId }, data });
  }
  if (productType === 'WIRE_WHEEL') {
    return prisma.wireWheel.update({ where: { id: productId }, data });
  }
  if (productType === 'BOLT_ON_WIRE_WHEEL') {
    return prisma.boltOnWireWheel.update({ where: { id: productId }, data });
  }
  return prisma.accessory.update({ where: { id: productId }, data });
}
