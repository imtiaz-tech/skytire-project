import { PriceMatchProductType, PrismaClient } from '@prisma/client';

export interface ResolvedPriceMatchProduct {
  productId: string;
  productType: PriceMatchProductType;
  productName: string;
  brandName: string;
  modelName: string | null;
  tireSize: string | null;
  cost: number;
  mapPrice: number;
  salePrice: number;
  images: string[];
}

type ProductRef = { productId: string; productType: PriceMatchProductType };

function productKey(productId: string, productType: PriceMatchProductType) {
  return `${productType}:${productId}`;
}

function buildTireProductName(
  brandName: string,
  modelName: string,
  tireSize: string | null,
  loadIndex: string | null,
  speedRating: string | null,
  loadRange: string | null
) {
  const parts = [brandName, modelName];
  if (tireSize) parts.push(tireSize);
  if (loadIndex) parts.push(loadIndex);
  if (speedRating) parts.push(speedRating);
  if (loadRange) parts.push(loadRange);
  return parts.filter(Boolean).join(' ');
}

export async function resolvePriceMatchProduct(
  prisma: PrismaClient,
  productId: string,
  productType: PriceMatchProductType
): Promise<ResolvedPriceMatchProduct | null> {
  const map = await resolvePriceMatchProducts(prisma, [{ productId, productType }]);
  return map.get(productKey(productId, productType)) ?? null;
}

export async function resolvePriceMatchProducts(
  prisma: PrismaClient,
  refs: ProductRef[]
): Promise<Map<string, ResolvedPriceMatchProduct>> {
  const result = new Map<string, ResolvedPriceMatchProduct>();

  const tireIds = refs.filter((r) => r.productType === 'TIRE').map((r) => r.productId);
  const wheelIds = refs.filter((r) => r.productType === 'WHEEL').map((r) => r.productId);
  const wireWheelIds = refs.filter((r) => r.productType === 'WIRE_WHEEL').map((r) => r.productId);
  const boltOnIds = refs.filter((r) => r.productType === 'BOLT_ON_WIRE_WHEEL').map((r) => r.productId);
  const accessoryIds = refs.filter((r) => r.productType === 'ACCESSORY').map((r) => r.productId);

  const [tires, wheels, wireWheels, boltOnWheels, accessories] = await Promise.all([
    tireIds.length
      ? prisma.tire.findMany({
          where: { id: { in: tireIds } },
          include: { model: { include: { brand: true } } },
        })
      : [],
    wheelIds.length
      ? prisma.wheel.findMany({
          where: { id: { in: wheelIds } },
          include: { brand: true },
        })
      : [],
    wireWheelIds.length
      ? prisma.wireWheel.findMany({
          where: { id: { in: wireWheelIds } },
          include: { brand: true },
        })
      : [],
    boltOnIds.length
      ? prisma.boltOnWireWheel.findMany({
          where: { id: { in: boltOnIds } },
          include: { brand: true },
        })
      : [],
    accessoryIds.length
      ? prisma.accessory.findMany({
          where: { id: { in: accessoryIds } },
          include: { brand: true },
        })
      : [],
  ]);

  for (const tire of tires) {
    const brandName = tire.model?.brand?.brandName ?? 'Unknown';
    const modelName = tire.model?.modelName ?? 'Unknown';
    result.set(productKey(tire.id, 'TIRE'), {
      productId: tire.id,
      productType: 'TIRE',
      productName: buildTireProductName(
        brandName,
        modelName,
        tire.tireSize,
        tire.loadIndex,
        tire.speedRating,
        tire.loadRange
      ),
      brandName,
      modelName,
      tireSize: tire.tireSize,
      cost: tire.cost,
      mapPrice: tire.mapPrice,
      salePrice: tire.salePrice,
      images: tire.model?.images ?? [],
    });
  }

  for (const wheel of wheels) {
    result.set(productKey(wheel.id, 'WHEEL'), {
      productId: wheel.id,
      productType: 'WHEEL',
      productName: wheel.productName,
      brandName: wheel.brand?.brandName ?? 'Unknown',
      modelName: null,
      tireSize: null,
      cost: wheel.cost,
      mapPrice: wheel.mapPrice,
      salePrice: wheel.salePrice,
      images: wheel.images ?? [],
    });
  }

  for (const wheel of wireWheels) {
    result.set(productKey(wheel.id, 'WIRE_WHEEL'), {
      productId: wheel.id,
      productType: 'WIRE_WHEEL',
      productName: wheel.name,
      brandName: wheel.brand?.brandName ?? 'Unknown',
      modelName: null,
      tireSize: null,
      cost: wheel.cost,
      mapPrice: wheel.mapPrice,
      salePrice: wheel.salePrice,
      images: wheel.images ?? [],
    });
  }

  for (const wheel of boltOnWheels) {
    result.set(productKey(wheel.id, 'BOLT_ON_WIRE_WHEEL'), {
      productId: wheel.id,
      productType: 'BOLT_ON_WIRE_WHEEL',
      productName: wheel.name,
      brandName: wheel.brand?.brandName ?? 'Unknown',
      modelName: null,
      tireSize: null,
      cost: wheel.cost,
      mapPrice: wheel.mapPrice,
      salePrice: wheel.salePrice,
      images: wheel.images ?? [],
    });
  }

  for (const accessory of accessories) {
    result.set(productKey(accessory.id, 'ACCESSORY'), {
      productId: accessory.id,
      productType: 'ACCESSORY',
      productName: accessory.productName,
      brandName: accessory.brand?.brandName ?? 'Unknown',
      modelName: null,
      tireSize: null,
      cost: accessory.cost,
      mapPrice: accessory.mapPrice,
      salePrice: accessory.salePrice,
      images: accessory.images ?? [],
    });
  }

  return result;
}
