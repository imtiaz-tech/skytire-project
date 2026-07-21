export type CostHistoryEntry = {
  value: number;
  createdAt: string | number;
};

export type SourceInventoryRow = {
  id: string;
  productType: string;
  productId: string;
  sourceId: string;
  stock: number;
  costHistory: CostHistoryEntry[];
  source?: {
    id: string;
    source: string;
  } | null;
};

export type MapPriceHistoryEntry = {
  value: number;
  createdAt: string | number;
};

export function parseCostHistory(raw: unknown): CostHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const value = Number((entry as CostHistoryEntry).value);
      if (!Number.isFinite(value)) return null;
      return {
        value,
        createdAt: (entry as CostHistoryEntry).createdAt ?? Date.now(),
      };
    })
    .filter((e): e is CostHistoryEntry => e !== null);
}

export function parseMapPriceHistory(raw: unknown): MapPriceHistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const value = Number((entry as MapPriceHistoryEntry).value);
      if (!Number.isFinite(value)) return null;
      return {
        value,
        createdAt: (entry as MapPriceHistoryEntry).createdAt ?? Date.now(),
      };
    })
    .filter((e): e is MapPriceHistoryEntry => e !== null);
}

export function latestCost(row: SourceInventoryRow): number | null {
  const history = parseCostHistory(row.costHistory);
  if (history.length === 0) return null;
  const value = history[0]?.value;
  return value === undefined || Number.isNaN(value) ? null : value;
}

export function formatCostDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'N/A';
  }
  const n = Number(value);
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, (m) => (m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m));
}

export function formatMoneyOrNA(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return 'N/A';
  }
  return `$${Number(value).toFixed(2)}`;
}

export function formatCostList(history: CostHistoryEntry[]): string {
  if (!history.length) return 'N/A';
  return history.map((h) => `$${Number(h.value)}`).join(', ');
}

export function getLastAndCurrentMap(
  mapPrice: number | null | undefined,
  mapPriceHistory: unknown
): { lastMap: number | null; currentMap: number | null } {
  const history = parseMapPriceHistory(mapPriceHistory);
  const currentFromHistory = history[0]?.value ?? null;
  const lastFromHistory = history[1]?.value ?? null;
  const currentMap =
    mapPrice !== null && mapPrice !== undefined && !Number.isNaN(Number(mapPrice))
      ? Number(mapPrice)
      : currentFromHistory;
  return {
    lastMap: lastFromHistory,
    currentMap,
  };
}
