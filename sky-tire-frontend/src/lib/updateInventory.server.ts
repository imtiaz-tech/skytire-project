import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { getSkippedDescription } from '@/lib/updateInventory';

export type InventoryType =
  | 'tire'
  | 'wheel'
  | 'wireWheel'
  | 'boltOnWheel'
  | 'accessory';

export type SelectedFields = {
  SKU: string;
  Brand?: string;
  Cost?: string;
  MAP?: string;
  Stock?: string;
  SalePrice?: string;
  RegularPrice?: string;
  IncreaseCost?: boolean;
  DecreaseCost?: boolean;
  inventoryType: InventoryType;
  source: string;
};

export type UpdatedProductRow = {
  id: string;
  sku: string;
  brand: string | null;
  prevCost: number;
  cost: number;
  prevStock: number;
  stock: number;
  stockStatus: 'increase' | 'decrease' | 'nochange';
  prevPrice: number;
  price: number;
  prevMap: number;
  map: number;
  mapChanged: boolean;
  priceChanged: number;
};

export type NotFoundProductRow = {
  sku: string;
  brand: string | null;
  reason: string;
  description: string;
  /** Exact row from the uploaded file (original column names/values) */
  originalRow?: Record<string, unknown> | null;
};

type ProductSnap = {
  id: string;
  sku: string;
  brandName: string | null;
  stock: number;
  cost: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  sourceLinked: boolean;
  mapPriceHistory?: Array<{ value: number; createdAt: string | number }>;
};

const STOCK_THRESHOLD = 10;
const BATCH_SIZE = 1000;

type SourceInvSnap = {
  sourceId: string;
  stock: number;
  latestCost: number | null;
};

function latestCostFromHistory(raw: unknown): number | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const value = Number((raw[0] as { value?: unknown })?.value);
  return Number.isFinite(value) ? value : null;
}

/**
 * Old controller behavior:
 * 1. After applying this source's stock/cost, consider sources with stock > 10.
 * 2. Use the minimum of those sources' latest costs as the product cost.
 * 3. If none qualify, fall back to costFromCSV.
 */
function resolveProposedCost(
  sourceSnaps: SourceInvSnap[],
  currentSourceId: string,
  pending: { stock?: number | null; cost?: number | null },
  costFromCSV: number
): number {
  const bySource = new Map(
    sourceSnaps.map((snap) => [snap.sourceId, { ...snap }])
  );
  const current = bySource.get(currentSourceId) ?? {
    sourceId: currentSourceId,
    stock: 0,
    latestCost: null as number | null,
  };

  if (pending.stock !== null && pending.stock !== undefined) {
    current.stock = pending.stock;
  }
  if (pending.cost !== null && pending.cost !== undefined) {
    current.latestCost = pending.cost;
  }
  bySource.set(currentSourceId, current);

  const costsFromStockSources: number[] = [];
  for (const snap of bySource.values()) {
    if (
      snap.stock > STOCK_THRESHOLD &&
      snap.latestCost !== null &&
      !Number.isNaN(snap.latestCost)
    ) {
      costsFromStockSources.push(snap.latestCost);
    }
  }

  if (costsFromStockSources.length > 0) {
    const minCost = Math.min(...costsFromStockSources);
    return !Number.isNaN(minCost) ? minCost : costFromCSV;
  }

  return costFromCSV;
}

function applySourceSnapUpdate(
  map: Map<string, SourceInvSnap[]>,
  productId: string,
  sourceId: string,
  pending: { stock?: number | null; cost?: number | null }
) {
  const list = [...(map.get(productId) || [])];
  const idx = list.findIndex((snap) => snap.sourceId === sourceId);
  const current =
    idx >= 0
      ? { ...list[idx] }
      : { sourceId, stock: 0, latestCost: null as number | null };

  if (pending.stock !== null && pending.stock !== undefined) {
    current.stock = pending.stock;
  }
  if (pending.cost !== null && pending.cost !== undefined) {
    current.latestCost = pending.cost;
  }

  if (idx >= 0) list[idx] = current;
  else list.push(current);
  map.set(productId, list);
}

async function loadSourceInventorySnaps(
  inventoryType: InventoryType,
  productIds: string[]
): Promise<Map<string, SourceInvSnap[]>> {
  const result = new Map<string, SourceInvSnap[]>();
  if (productIds.length === 0) return result;

  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const chunk = productIds.slice(i, i + BATCH_SIZE);
    const rows = await prisma.productSourceInventory.findMany({
      where: { productType: inventoryType, productId: { in: chunk } },
      select: {
        productId: true,
        sourceId: true,
        stock: true,
        costHistory: true,
      },
    });

    for (const row of rows) {
      const list = result.get(row.productId) || [];
      list.push({
        sourceId: row.sourceId,
        stock: row.stock,
        latestCost: latestCostFromHistory(row.costHistory),
      });
      result.set(row.productId, list);
    }
  }

  return result;
}

function normalizeBrandName(brandName: unknown): string {
  if (!brandName) return '';
  return brandName
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseMoney(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]+/g, '') || '0');
  return Number.isFinite(n) ? n : null;
}

function parseStock(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return NaN as unknown as number;
  const n = parseInt(String(raw).replace(/[^0-9.]+/g, ''), 10);
  return n;
}

function checkSaleAndMapPrice(salePrice: number, mapPrice: number): number {
  return salePrice >= mapPrice ? salePrice : mapPrice;
}

function checkStockStatus(delta: number): 'increase' | 'decrease' | 'nochange' {
  return delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'nochange';
}

function applyStockFromCsv(stockFromCSV: number | null): number | null {
  if (stockFromCSV === null || Number.isNaN(stockFromCSV)) return null;
  return stockFromCSV > STOCK_THRESHOLD ? stockFromCSV : 0;
}

export function parseWorkbookRows(buffer: Buffer): {
  rows: Record<string, unknown>[];
  columns: string[];
} {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], columns: [] };
  const sheet = workbook.Sheets[sheetName];
  const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: '',
  })[0] as string[] | undefined;
  const columns = (headerRow || [])
    .map((h) => String(h ?? '').trim())
    .filter(Boolean);
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });
  const resolvedColumns =
    columns.length > 0
      ? columns
      : Object.keys(rows[0] || {});
  return { rows, columns: resolvedColumns };
}

function pickOriginalRow(
  row: Record<string, unknown>,
  columns: string[]
): Record<string, unknown> {
  if (columns.length === 0) return { ...row };
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    out[col] = row[col] ?? '';
  }
  return out;
}

async function resolveInventorySource(sourceName: string) {
  const existing = await prisma.inventorySource.findUnique({
    where: { source: sourceName },
  });
  if (existing) return existing;
  return prisma.inventorySource.create({ data: { source: sourceName } });
}

async function fetchProductsBySkus(
  inventoryType: InventoryType,
  skus: string[]
): Promise<Map<string, ProductSnap>> {
  const map = new Map<string, ProductSnap>();
  if (skus.length === 0) return map;

  for (let i = 0; i < skus.length; i += BATCH_SIZE) {
    const chunk = skus.slice(i, i + BATCH_SIZE);

    switch (inventoryType) {
      case 'tire': {
        const docs = await prisma.tire.findMany({
          where: { sku: { in: chunk } },
          select: {
            id: true,
            sku: true,
            stock: true,
            cost: true,
            salePrice: true,
            regularPrice: true,
            mapPrice: true,
            mapPriceHistory: true,
            model: { select: { brand: { select: { brandName: true } } } },
            sources: { select: { id: true } },
          },
        });
        for (const d of docs) {
          if (!d.sku) continue;
          const history = Array.isArray(d.mapPriceHistory)
            ? (d.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
            : [];
          map.set(d.sku, {
            id: d.id,
            sku: d.sku,
            brandName: d.model?.brand?.brandName ?? null,
            stock: d.stock,
            cost: d.cost,
            salePrice: d.salePrice,
            regularPrice: d.regularPrice,
            mapPrice: d.mapPrice,
            sourceLinked: false,
            mapPriceHistory: history,
          });
        }
        break;
      }
      case 'wheel': {
        const docs = await prisma.wheel.findMany({
          where: { sku: { in: chunk } },
          select: {
            id: true,
            sku: true,
            stock: true,
            cost: true,
            salePrice: true,
            regularPrice: true,
            mapPrice: true,
            mapPriceHistory: true,
            brand: { select: { brandName: true } },
            sources: { select: { id: true } },
          },
        });
        for (const d of docs) {
          const history = Array.isArray(d.mapPriceHistory)
            ? (d.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
            : [];
          map.set(d.sku, {
            id: d.id,
            sku: d.sku,
            brandName: d.brand?.brandName ?? null,
            stock: d.stock,
            cost: d.cost,
            salePrice: d.salePrice,
            regularPrice: d.regularPrice,
            mapPrice: d.mapPrice,
            sourceLinked: false,
            mapPriceHistory: history,
          });
        }
        break;
      }
      case 'wireWheel': {
        const docs = await prisma.wireWheel.findMany({
          where: { sku: { in: chunk } },
          select: {
            id: true,
            sku: true,
            stock: true,
            cost: true,
            salePrice: true,
            regularPrice: true,
            mapPrice: true,
            mapPriceHistory: true,
            sourceId: true,
            brand: { select: { brandName: true } },
          },
        });
        for (const d of docs) {
          const history = Array.isArray(d.mapPriceHistory)
            ? (d.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
            : [];
          map.set(d.sku, {
            id: d.id,
            sku: d.sku,
            brandName: d.brand?.brandName ?? null,
            stock: d.stock,
            cost: d.cost,
            salePrice: d.salePrice,
            regularPrice: d.regularPrice,
            mapPrice: d.mapPrice,
            sourceLinked: false,
            mapPriceHistory: history,
          });
        }
        break;
      }
      case 'boltOnWheel': {
        const docs = await prisma.boltOnWireWheel.findMany({
          where: { sku: { in: chunk } },
          select: {
            id: true,
            sku: true,
            stock: true,
            cost: true,
            salePrice: true,
            regularPrice: true,
            mapPrice: true,
            mapPriceHistory: true,
            sourceId: true,
            brand: { select: { brandName: true } },
          },
        });
        for (const d of docs) {
          const history = Array.isArray(d.mapPriceHistory)
            ? (d.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
            : [];
          map.set(d.sku, {
            id: d.id,
            sku: d.sku,
            brandName: d.brand?.brandName ?? null,
            stock: d.stock,
            cost: d.cost,
            salePrice: d.salePrice,
            regularPrice: d.regularPrice,
            mapPrice: d.mapPrice,
            sourceLinked: false,
            mapPriceHistory: history,
          });
        }
        break;
      }
      case 'accessory': {
        const docs = await prisma.accessory.findMany({
          where: { sku: { in: chunk } },
          select: {
            id: true,
            sku: true,
            stock: true,
            cost: true,
            salePrice: true,
            regularPrice: true,
            mapPrice: true,
            mapPriceHistory: true,
            sourceId: true,
            brand: { select: { brandName: true } },
          },
        });
        for (const d of docs) {
          const history = Array.isArray(d.mapPriceHistory)
            ? (d.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
            : [];
          map.set(d.sku, {
            id: d.id,
            sku: d.sku,
            brandName: d.brand?.brandName ?? null,
            stock: d.stock,
            cost: d.cost,
            salePrice: d.salePrice,
            regularPrice: d.regularPrice ?? 0,
            mapPrice: d.mapPrice,
            sourceLinked: false,
            mapPriceHistory: history,
          });
        }
        break;
      }
    }
  }

  return map;
}

async function markSourceLinks(
  inventoryType: InventoryType,
  productMap: Map<string, ProductSnap>,
  sourceId: string
) {
  const ids = Array.from(productMap.values()).map((p) => p.id);
  if (ids.length === 0) return;

  switch (inventoryType) {
    case 'tire': {
      const linked = await prisma.tire.findMany({
        where: { id: { in: ids }, sources: { some: { id: sourceId } } },
        select: { id: true, sku: true },
      });
      const linkedIds = new Set(linked.map((l) => l.id));
      for (const p of productMap.values()) {
        p.sourceLinked = linkedIds.has(p.id);
      }
      break;
    }
    case 'wheel': {
      const linked = await prisma.wheel.findMany({
        where: { id: { in: ids }, sources: { some: { id: sourceId } } },
        select: { id: true },
      });
      const linkedIds = new Set(linked.map((l) => l.id));
      for (const p of productMap.values()) {
        p.sourceLinked = linkedIds.has(p.id);
      }
      break;
    }
    case 'wireWheel': {
      const linked = await prisma.wireWheel.findMany({
        where: { id: { in: ids }, sourceId },
        select: { id: true },
      });
      const linkedIds = new Set(linked.map((l) => l.id));
      for (const p of productMap.values()) {
        p.sourceLinked = linkedIds.has(p.id);
      }
      break;
    }
    case 'boltOnWheel': {
      const linked = await prisma.boltOnWireWheel.findMany({
        where: { id: { in: ids }, sourceId },
        select: { id: true },
      });
      const linkedIds = new Set(linked.map((l) => l.id));
      for (const p of productMap.values()) {
        p.sourceLinked = linkedIds.has(p.id);
      }
      break;
    }
    case 'accessory': {
      const linked = await prisma.accessory.findMany({
        where: { id: { in: ids }, sourceId },
        select: { id: true },
      });
      const linkedIds = new Set(linked.map((l) => l.id));
      for (const p of productMap.values()) {
        p.sourceLinked = linkedIds.has(p.id);
      }
      break;
    }
  }
}

async function resetMapForSource(inventoryType: InventoryType, sourceId: string) {
  switch (inventoryType) {
    case 'tire': {
      const products = await prisma.tire.findMany({
        where: { sources: { some: { id: sourceId } } },
        select: { id: true, mapPriceHistory: true },
      });
      for (const p of products) {
        const history = Array.isArray(p.mapPriceHistory)
          ? (p.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
          : [];
        await prisma.tire.update({
          where: { id: p.id },
          data: {
            mapPrice: 0,
            mapPriceHistory: [{ value: 0, createdAt: Date.now() }, ...history].slice(0, 2),
          },
        });
      }
      break;
    }
    case 'wheel': {
      const products = await prisma.wheel.findMany({
        where: { sources: { some: { id: sourceId } } },
        select: { id: true, mapPriceHistory: true },
      });
      for (const p of products) {
        const history = Array.isArray(p.mapPriceHistory)
          ? (p.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
          : [];
        await prisma.wheel.update({
          where: { id: p.id },
          data: {
            mapPrice: 0,
            mapPriceHistory: [{ value: 0, createdAt: Date.now() }, ...history].slice(0, 2),
          },
        });
      }
      break;
    }
    case 'wireWheel': {
      const products = await prisma.wireWheel.findMany({
        where: { sourceId },
        select: { id: true, mapPriceHistory: true },
      });
      for (const p of products) {
        const history = Array.isArray(p.mapPriceHistory)
          ? (p.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
          : [];
        await prisma.wireWheel.update({
          where: { id: p.id },
          data: {
            mapPrice: 0,
            mapPriceHistory: [{ value: 0, createdAt: Date.now() }, ...history].slice(0, 2),
          },
        });
      }
      break;
    }
    case 'boltOnWheel': {
      const products = await prisma.boltOnWireWheel.findMany({
        where: { sourceId },
        select: { id: true, mapPriceHistory: true },
      });
      for (const p of products) {
        const history = Array.isArray(p.mapPriceHistory)
          ? (p.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
          : [];
        await prisma.boltOnWireWheel.update({
          where: { id: p.id },
          data: {
            mapPrice: 0,
            mapPriceHistory: [{ value: 0, createdAt: Date.now() }, ...history].slice(0, 2),
          },
        });
      }
      break;
    }
    case 'accessory': {
      const accessories = await prisma.accessory.findMany({
        where: { sourceId },
        select: { id: true, mapPriceHistory: true },
      });
      for (const a of accessories) {
        const history = Array.isArray(a.mapPriceHistory)
          ? (a.mapPriceHistory as Array<{ value: number; createdAt: string | number }>)
          : [];
        const next = [
          { value: 0, createdAt: Date.now() },
          ...history,
        ].slice(0, 2);
        await prisma.accessory.update({
          where: { id: a.id },
          data: { mapPrice: 0, mapPriceHistory: next },
        });
      }
      break;
    }
  }
}

async function resetStockForSource(
  inventoryType: InventoryType,
  sourceId: string
): Promise<Map<string, number>> {
  const originalStockMap = new Map<string, number>();

  switch (inventoryType) {
    case 'tire': {
      const products = await prisma.tire.findMany({
        where: { sources: { some: { id: sourceId } } },
        select: { id: true, sku: true, stock: true },
      });
      for (const p of products) {
        if (p.sku) originalStockMap.set(p.sku, p.stock);
      }
      if (products.length > 0) {
        await prisma.tire.updateMany({
          where: { id: { in: products.map((p) => p.id) } },
          data: { stock: 0 },
        });
      }
      break;
    }
    case 'wheel': {
      const products = await prisma.wheel.findMany({
        where: { sources: { some: { id: sourceId } } },
        select: { id: true, sku: true, stock: true },
      });
      for (const p of products) originalStockMap.set(p.sku, p.stock);
      if (products.length > 0) {
        await prisma.wheel.updateMany({
          where: { id: { in: products.map((p) => p.id) } },
          data: { stock: 0 },
        });
      }
      break;
    }
    case 'wireWheel': {
      const products = await prisma.wireWheel.findMany({
        where: { sourceId },
        select: { id: true, sku: true, stock: true },
      });
      for (const p of products) originalStockMap.set(p.sku, p.stock);
      if (products.length > 0) {
        await prisma.wireWheel.updateMany({
          where: { id: { in: products.map((p) => p.id) } },
          data: { stock: 0 },
        });
      }
      break;
    }
    case 'boltOnWheel': {
      const products = await prisma.boltOnWireWheel.findMany({
        where: { sourceId },
        select: { id: true, sku: true, stock: true },
      });
      for (const p of products) originalStockMap.set(p.sku, p.stock);
      if (products.length > 0) {
        await prisma.boltOnWireWheel.updateMany({
          where: { id: { in: products.map((p) => p.id) } },
          data: { stock: 0 },
        });
      }
      break;
    }
    case 'accessory': {
      const products = await prisma.accessory.findMany({
        where: { sourceId },
        select: { id: true, sku: true, stock: true },
      });
      for (const p of products) originalStockMap.set(p.sku, p.stock);
      if (products.length > 0) {
        await prisma.accessory.updateMany({
          where: { id: { in: products.map((p) => p.id) } },
          data: { stock: 0 },
        });
      }
      break;
    }
  }

  await zeroSourceInventoryStock(inventoryType, sourceId);
  return originalStockMap;
}

async function persistProduct(
  inventoryType: InventoryType,
  productId: string,
  data: {
    stock?: number;
    cost?: number;
    salePrice?: number;
    regularPrice?: number;
    mapPrice?: number;
    priceChanged?: number;
    mapPriceHistory?: Array<{ value: number; createdAt: string | number }>;
    connectSourceId?: string;
    setSourceId?: string;
  }
) {
  const { connectSourceId, setSourceId, mapPriceHistory, priceChanged, ...scalars } = data;

  switch (inventoryType) {
    case 'tire':
      await prisma.tire.update({
        where: { id: productId },
        data: {
          ...scalars,
          ...(mapPriceHistory ? { mapPriceHistory } : {}),
          ...(connectSourceId
            ? { sources: { connect: { id: connectSourceId } } }
            : {}),
        },
      });
      break;
    case 'wheel':
      await prisma.wheel.update({
        where: { id: productId },
        data: {
          ...scalars,
          ...(mapPriceHistory ? { mapPriceHistory } : {}),
          ...(connectSourceId
            ? { sources: { connect: { id: connectSourceId } } }
            : {}),
        },
      });
      break;
    case 'wireWheel':
      await prisma.wireWheel.update({
        where: { id: productId },
        data: {
          ...scalars,
          ...(mapPriceHistory ? { mapPriceHistory } : {}),
          ...(setSourceId ? { sourceId: setSourceId } : {}),
        },
      });
      break;
    case 'boltOnWheel':
      await prisma.boltOnWireWheel.update({
        where: { id: productId },
        data: {
          ...scalars,
          ...(mapPriceHistory ? { mapPriceHistory } : {}),
          ...(setSourceId ? { sourceId: setSourceId } : {}),
        },
      });
      break;
    case 'accessory':
      await prisma.accessory.update({
        where: { id: productId },
        data: {
          ...scalars,
          ...(priceChanged !== undefined ? { priceChanged } : {}),
          ...(mapPriceHistory ? { mapPriceHistory } : {}),
          ...(setSourceId ? { sourceId: setSourceId } : {}),
        },
      });
      break;
  }
}

async function upsertSourceInventory(params: {
  productType: InventoryType;
  productId: string;
  sourceId: string;
  stock?: number | null;
  cost?: number | null;
  zeroStockOnly?: boolean;
}) {
  const { productType, productId, sourceId, stock, cost, zeroStockOnly } = params;
  const existing = await prisma.productSourceInventory.findUnique({
    where: {
      productType_productId_sourceId: { productType, productId, sourceId },
    },
  });

  const prevHistory = Array.isArray(existing?.costHistory)
    ? (existing!.costHistory as Array<{ value: number; createdAt: string | number }>)
    : [];

  let nextHistory = prevHistory;
  if (cost !== null && cost !== undefined && !Number.isNaN(cost)) {
    nextHistory = [{ value: cost, createdAt: Date.now() }, ...prevHistory].slice(0, 30);
  }

  const nextStock =
    stock !== null && stock !== undefined && !Number.isNaN(stock)
      ? stock
      : zeroStockOnly
        ? 0
        : (existing?.stock ?? 0);

  await prisma.productSourceInventory.upsert({
    where: {
      productType_productId_sourceId: { productType, productId, sourceId },
    },
    create: {
      productType,
      productId,
      sourceId,
      stock: nextStock,
      costHistory: nextHistory,
    },
    update: {
      stock: nextStock,
      costHistory: nextHistory,
    },
  });
}

async function zeroSourceInventoryStock(
  productType: InventoryType,
  sourceId: string
) {
  await prisma.productSourceInventory.updateMany({
    where: { productType, sourceId },
    data: { stock: 0 },
  });
}

export async function processInventoryRows(
  rows: Record<string, unknown>[],
  selectedFields: SelectedFields,
  uploadColumns: string[] = []
): Promise<{ updatedProducts: UpdatedProductRow[]; notFoundProducts: NotFoundProductRow[] }> {
  const updatedProducts: UpdatedProductRow[] = [];
  const notFoundProducts: NotFoundProductRow[] = [];

  const {
    SKU: skuField,
    Brand: brandField,
    Cost: costField,
    MAP: mapField,
    Stock: stockField,
    SalePrice: salePriceField,
    RegularPrice: regularPriceField,
    inventoryType,
    IncreaseCost,
    DecreaseCost,
    source: sourceField,
  } = selectedFields;

  const columns =
    uploadColumns.length > 0
      ? uploadColumns
      : Object.keys(rows[0] || {});

  const pushSkipped = (
    sku: string,
    reason: string,
    brand: string | null | undefined,
    row: Record<string, unknown>
  ) => {
    notFoundProducts.push({
      sku,
      brand: brand?.trim() ? brand.trim() : null,
      reason,
      description: getSkippedDescription(reason, inventoryType),
      originalRow: pickOriginalRow(row, columns),
    });
  };

  if (!skuField || !inventoryType || !sourceField) {
    throw new Error('SKU, inventory type, and source are required');
  }

  const inventorySource = await resolveInventorySource(sourceField);
  const sourceId = inventorySource.id;

  const originalMapMap = new Map<string, number>();
  let originalStockMap = new Map<string, number>();

  if (mapField) {
    // Capture previous MAP for products currently linked to this source, then zero.
    const productMapPreview = await fetchProductsLinkedToSource(inventoryType, sourceId);
    for (const [sku, snap] of productMapPreview) {
      originalMapMap.set(sku, snap.mapPrice);
    }
    await resetMapForSource(inventoryType, sourceId);
  }

  if (stockField) {
    originalStockMap = await resetStockForSource(inventoryType, sourceId);
  }

  const skuSet = new Set<string>();
  for (const row of rows) {
    const sku =
      row[skuField]?.toString().trim() ||
      row['\uFEFFsku']?.toString().trim() ||
      '';
    if (sku) skuSet.add(sku);
  }

  const productMap = await fetchProductsBySkus(inventoryType, Array.from(skuSet));
  await markSourceLinks(inventoryType, productMap, sourceId);

  // Load per-source stock/cost after stock reset so min-cost uses current state
  const sourceInventoryByProduct = await loadSourceInventorySnaps(
    inventoryType,
    Array.from(productMap.values()).map((p) => p.id)
  );

  // After stock/map resets, refresh stock/map on snaps that were zeroed
  if (stockField || mapField) {
    for (const [sku, snap] of productMap) {
      if (stockField && originalStockMap.has(sku)) {
        // product was zeroed; current stock is 0 unless we set it from CSV
        snap.stock = 0;
      }
      if (mapField && originalMapMap.has(sku)) {
        snap.mapPrice = 0;
      }
    }
  }

  const WRITE_CHUNK = 50;
  const pendingWrites: Promise<unknown>[] = [];

  const flushWrites = async () => {
    if (pendingWrites.length === 0) return;
    await Promise.all(pendingWrites.splice(0, pendingWrites.length));
  };

  for (const row of rows) {
    const sku =
      row[skuField]?.toString().trim() ||
      row['\uFEFFsku']?.toString().trim() ||
      '';

    const brandFromCSV = brandField
      ? row[brandField]?.toString().trim() || null
      : null;
    const normalizedBrandFromCSV =
      brandFromCSV && brandFromCSV.length > 0
        ? normalizeBrandName(brandFromCSV)
        : null;

    if (!sku) {
      pushSkipped(sku || 'N/A', 'Missing SKU', brandFromCSV, row);
      continue;
    }

    const product = productMap.get(sku);
    if (!product) {
      pushSkipped(sku, 'Product not found', brandFromCSV, row);
      continue;
    }

    if (normalizedBrandFromCSV) {
      if (product.brandName) {
        if (normalizeBrandName(product.brandName) !== normalizedBrandFromCSV) {
          pushSkipped(
            sku,
            `Brand mismatch: expected '${brandFromCSV}', found '${product.brandName}'`,
            product.brandName || brandFromCSV,
            row
          );
          continue;
        }
      }
    }

    let costFromCSV = costField ? parseMoney(row[costField]) : null;
    if (costFromCSV !== null && (Number.isNaN(costFromCSV) || costFromCSV <= 0)) {
      costFromCSV = null;
    }

    let mapFromCSV = mapField ? parseMoney(row[mapField]) : null;
    if (mapFromCSV !== null && Number.isNaN(mapFromCSV)) {
      mapFromCSV = null;
    }

    let salePriceFromCSV = salePriceField ? parseMoney(row[salePriceField]) : null;
    if (
      salePriceFromCSV !== null &&
      (Number.isNaN(salePriceFromCSV) || salePriceFromCSV <= 0)
    ) {
      salePriceFromCSV = null;
    }

    let regularPriceFromCSV = regularPriceField
      ? parseMoney(row[regularPriceField])
      : null;
    if (
      regularPriceFromCSV !== null &&
      (Number.isNaN(regularPriceFromCSV) || regularPriceFromCSV <= 0)
    ) {
      regularPriceFromCSV = null;
    }

    let stockFromCSV: number | null = stockField
      ? parseStock(row[stockField])
      : null;
    if (stockField && (stockFromCSV === null || Number.isNaN(stockFromCSV as number))) {
      pushSkipped(
        sku,
        'Invalid stock value',
        product.brandName || brandFromCSV,
        row
      );
      continue;
    }

    const previousCost = product.cost;
    const previousSalePrice = product.salePrice;
    const previousMap = mapField
      ? (originalMapMap.get(sku) ?? product.mapPrice)
      : product.mapPrice;
    const previousStock = originalStockMap.has(sku)
      ? (originalStockMap.get(sku) as number)
      : product.stock;

    let nextStock = product.stock;
    let nextCost = product.cost;
    let nextSale = product.salePrice;
    let nextRegular = product.regularPrice;
    let nextMap = product.mapPrice;
    let stockStatus: UpdatedProductRow['stockStatus'] = 'nochange';
    let skipped = false;

    const appliedStock = applyStockFromCsv(stockFromCSV);
    if (stockField && appliedStock !== null) {
      nextStock = appliedStock;
      stockStatus = checkStockStatus(nextStock - previousStock);
    }

    if (mapField && mapFromCSV !== null) {
      nextMap = mapFromCSV;
      nextSale = checkSaleAndMapPrice(nextSale, mapFromCSV);
    }

    if (costField && costFromCSV !== null) {
      const pendingSourceStock =
        stockField && appliedStock !== null ? appliedStock : null;
      const newProposedCost = resolveProposedCost(
        sourceInventoryByProduct.get(product.id) || [],
        sourceId,
        { stock: pendingSourceStock, cost: costFromCSV },
        costFromCSV
      );
      const costDifference = newProposedCost - nextCost;

      if (costDifference !== 0) {
        nextCost = newProposedCost;

        if (salePriceField && salePriceFromCSV !== null) {
          if (salePriceFromCSV < nextCost) {
            pushSkipped(
              sku,
              `Sale price ($${salePriceFromCSV.toFixed(2)}) is below cost ($${nextCost.toFixed(2)})`,
              product.brandName || brandFromCSV,
              row
            );
            skipped = true;
          } else {
            let sale = salePriceFromCSV;
            if (nextMap && !Number.isNaN(nextMap) && sale < nextMap) {
              sale = nextMap;
            }
            nextSale = sale;
          }
        } else if (
          (IncreaseCost && costDifference > 0) ||
          (DecreaseCost && costDifference < 0)
        ) {
          nextSale = nextSale + costDifference;
          if (nextMap !== undefined && nextMap !== null && !Number.isNaN(nextMap)) {
            nextSale = checkSaleAndMapPrice(nextSale, nextMap);
          }
        }

        if (!skipped) {
          if (regularPriceField && regularPriceFromCSV !== null) {
            let regular = regularPriceFromCSV;
            if (regular < nextSale) {
              regular = parseFloat((nextSale * 1.2).toFixed(2));
            }
            nextRegular = regular;
          } else {
            nextRegular = nextRegular + costDifference;
          }

          if (nextRegular <= nextSale) {
            nextRegular = parseFloat((nextSale * 1.25).toFixed(2));
          }
        }
      } else {
        if (salePriceField && salePriceFromCSV !== null) {
          if (salePriceFromCSV < nextCost) {
            pushSkipped(
              sku,
              `Sale price ($${salePriceFromCSV.toFixed(2)}) is below cost ($${nextCost.toFixed(2)})`,
              product.brandName || brandFromCSV,
              row
            );
            skipped = true;
          } else {
            let sale = salePriceFromCSV;
            if (nextMap && !Number.isNaN(nextMap) && sale < nextMap) {
              sale = nextMap;
            }
            nextSale = sale;
          }
        }
        if (!skipped && regularPriceField && regularPriceFromCSV !== null) {
          let regular = regularPriceFromCSV;
          if (regular < nextSale) {
            regular = parseFloat((nextSale * 1.2).toFixed(2));
          }
          nextRegular = regular;
        }
        if (!skipped && nextRegular <= nextSale) {
          nextRegular = parseFloat((nextSale * 1.25).toFixed(2));
        }
      }
    }

    if (skipped) continue;

    // Enforce sale >= cost and sale >= map
    if (nextSale < nextCost) {
      pushSkipped(
        sku,
        `Sale price ($${nextSale.toFixed(2)}) is below cost ($${nextCost.toFixed(2)})`,
        product.brandName || brandFromCSV,
        row
      );
      continue;
    }
    if (nextMap > 0 && nextSale < nextMap) {
      nextSale = nextMap;
    }
    if (nextRegular <= nextSale) {
      nextRegular = parseFloat((nextSale * 1.25).toFixed(2));
    }

    const priceChanged = nextSale - previousSalePrice;

    const writeData: Parameters<typeof persistProduct>[2] = {
      stock: nextStock,
      cost: nextCost,
      salePrice: nextSale,
      regularPrice: nextRegular,
      mapPrice: nextMap,
    };

    if (inventoryType === 'tire' || inventoryType === 'wheel') {
      if (!product.sourceLinked) {
        writeData.connectSourceId = sourceId;
      }
    } else {
      writeData.setSourceId = sourceId;
    }

    if (inventoryType === 'accessory') {
      writeData.priceChanged = priceChanged;
    }

    if (mapField && mapFromCSV !== null) {
      const history = [
        { value: mapFromCSV, createdAt: Date.now() },
        ...(product.mapPriceHistory || []),
      ].slice(0, 2);
      writeData.mapPriceHistory = history;
      product.mapPriceHistory = history;
    }

    pendingWrites.push(
      (async () => {
        await persistProduct(inventoryType, product.id, writeData);
        await upsertSourceInventory({
          productType: inventoryType,
          productId: product.id,
          sourceId,
          stock: stockField ? nextStock : null,
          cost: costField && costFromCSV !== null ? costFromCSV : null,
        });
      })()
    );
    if (pendingWrites.length >= WRITE_CHUNK) {
      await flushWrites();
    }

    // Update in-memory snap for consistency if SKU repeats
    product.stock = nextStock;
    product.cost = nextCost;
    product.salePrice = nextSale;
    product.regularPrice = nextRegular;
    product.mapPrice = nextMap;
    product.sourceLinked = true;
    applySourceSnapUpdate(sourceInventoryByProduct, product.id, sourceId, {
      stock: stockField ? nextStock : null,
      cost: costField && costFromCSV !== null ? costFromCSV : null,
    });

    updatedProducts.push({
      id: product.id,
      sku: product.sku,
      brand: product.brandName,
      prevCost: previousCost,
      cost: nextCost,
      prevStock: previousStock,
      stock: nextStock,
      stockStatus,
      prevPrice: previousSalePrice,
      price: nextSale,
      prevMap: previousMap,
      map: nextMap,
      mapChanged: Boolean(mapField) && previousMap !== nextMap,
      priceChanged,
    });
  }

  await flushWrites();

  return { updatedProducts, notFoundProducts };
}

async function fetchProductsLinkedToSource(
  inventoryType: InventoryType,
  sourceId: string
): Promise<Map<string, ProductSnap>> {
  const map = new Map<string, ProductSnap>();

  switch (inventoryType) {
    case 'tire': {
      const docs = await prisma.tire.findMany({
        where: { sources: { some: { id: sourceId } } },
        select: {
          id: true,
          sku: true,
          stock: true,
          cost: true,
          salePrice: true,
          regularPrice: true,
          mapPrice: true,
        },
      });
      for (const d of docs) {
        if (!d.sku) continue;
        map.set(d.sku, {
          id: d.id,
          sku: d.sku,
          brandName: null,
          stock: d.stock,
          cost: d.cost,
          salePrice: d.salePrice,
          regularPrice: d.regularPrice,
          mapPrice: d.mapPrice,
          sourceLinked: true,
        });
      }
      break;
    }
    case 'wheel': {
      const docs = await prisma.wheel.findMany({
        where: { sources: { some: { id: sourceId } } },
        select: {
          id: true,
          sku: true,
          stock: true,
          cost: true,
          salePrice: true,
          regularPrice: true,
          mapPrice: true,
        },
      });
      for (const d of docs) {
        map.set(d.sku, {
          id: d.id,
          sku: d.sku,
          brandName: null,
          stock: d.stock,
          cost: d.cost,
          salePrice: d.salePrice,
          regularPrice: d.regularPrice,
          mapPrice: d.mapPrice,
          sourceLinked: true,
        });
      }
      break;
    }
    case 'wireWheel': {
      const docs = await prisma.wireWheel.findMany({
        where: { sourceId },
        select: {
          id: true,
          sku: true,
          stock: true,
          cost: true,
          salePrice: true,
          regularPrice: true,
          mapPrice: true,
        },
      });
      for (const d of docs) {
        map.set(d.sku, {
          id: d.id,
          sku: d.sku,
          brandName: null,
          stock: d.stock,
          cost: d.cost,
          salePrice: d.salePrice,
          regularPrice: d.regularPrice,
          mapPrice: d.mapPrice,
          sourceLinked: true,
        });
      }
      break;
    }
    case 'boltOnWheel': {
      const docs = await prisma.boltOnWireWheel.findMany({
        where: { sourceId },
        select: {
          id: true,
          sku: true,
          stock: true,
          cost: true,
          salePrice: true,
          regularPrice: true,
          mapPrice: true,
        },
      });
      for (const d of docs) {
        map.set(d.sku, {
          id: d.id,
          sku: d.sku,
          brandName: null,
          stock: d.stock,
          cost: d.cost,
          salePrice: d.salePrice,
          regularPrice: d.regularPrice,
          mapPrice: d.mapPrice,
          sourceLinked: true,
        });
      }
      break;
    }
    case 'accessory': {
      const docs = await prisma.accessory.findMany({
        where: { sourceId },
        select: {
          id: true,
          sku: true,
          stock: true,
          cost: true,
          salePrice: true,
          regularPrice: true,
          mapPrice: true,
        },
      });
      for (const d of docs) {
        map.set(d.sku, {
          id: d.id,
          sku: d.sku,
          brandName: null,
          stock: d.stock,
          cost: d.cost,
          salePrice: d.salePrice,
          regularPrice: d.regularPrice ?? 0,
          mapPrice: d.mapPrice,
          sourceLinked: true,
        });
      }
      break;
    }
  }

  return map;
}

export async function saveInventorySummary(
  updatedProducts: UpdatedProductRow[],
  notFoundProducts: NotFoundProductRow[],
  inventoryType: string,
  sourceName?: string | null,
  uploadColumns: string[] = [],
  userId?: number | null
) {
  const existing = await prisma.inventoryUpdateSummary.findFirst({
    orderBy: { timestamp: 'desc' },
  });

  const data = {
    updatedProducts,
    notFoundProducts,
    inventoryType,
    sourceName: sourceName || null,
    uploadColumns,
    timestamp: new Date(),
    createdById: userId ?? null,
  };

  if (existing) {
    await prisma.inventoryUpdateSummary.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.inventoryUpdateSummary.create({ data });
  }
}
