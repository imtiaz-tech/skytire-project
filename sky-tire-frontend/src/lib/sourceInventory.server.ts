import { prisma } from '@/lib/prisma';
import { parseCostHistory, type SourceInventoryRow } from '@/lib/sourceInventory';

export type ProductInventoryKind =
  | 'tire'
  | 'wheel'
  | 'wireWheel'
  | 'boltOnWheel'
  | 'accessory';

export async function fetchSourceInventories(
  productType: ProductInventoryKind,
  productId: string
): Promise<SourceInventoryRow[]> {
  const rows = await prisma.productSourceInventory.findMany({
    where: { productType, productId },
    include: {
      source: { select: { id: true, source: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    productType: row.productType,
    productId: row.productId,
    sourceId: row.sourceId,
    stock: row.stock,
    costHistory: parseCostHistory(row.costHistory),
    source: row.source,
  }));
}

export async function attachSourceInventories<T extends { id: string }>(
  productType: ProductInventoryKind,
  product: T | null
): Promise<(T & { sourceInventories: SourceInventoryRow[] }) | null> {
  if (!product) return null;
  const sourceInventories = await fetchSourceInventories(productType, product.id);
  return { ...product, sourceInventories };
}
