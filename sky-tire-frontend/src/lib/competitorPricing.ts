import * as XLSX from 'xlsx';
import {
  CompetitorMatch,
  CompetitorProduct,
  CompetitorRow,
  PriceHistoryEntry,
  PriceUpdateHistoryRow,
  ProductWithPriceHistory,
  ScrapedData,
} from '@/redux/types/competitorPricingTypes';

/** Normalize text for ID matching: trim + lowercase */
export function normalizeId(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

export function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const cleaned = String(value).replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeHeader(header: unknown): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, ' ');
}

/** Map flexible Excel headers to canonical field names */
function resolveColumnMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((raw, index) => {
    const h = normalizeHeader(raw);
    if (
      h === 'productid' ||
      h === 'product id' ||
      h === 'product_id' ||
      h === 'id'
    ) {
      map.productId = index;
    } else if (h === 'title' || h === 'name' || h === 'product name') {
      map.title = index;
    } else if (
      h === 'sale price' ||
      h === 'saleprice' ||
      h === 'sale' ||
      h === 'price'
    ) {
      if (map.salePrice === undefined) map.salePrice = index;
    } else if (
      h === 'regular price' ||
      h === 'regularprice' ||
      h === 'regular' ||
      h === 'list price'
    ) {
      map.regularPrice = index;
    } else if (h === 'stock' || h === 'qty' || h === 'quantity' || h === 'inventory') {
      map.stock = index;
    } else if (h === 'url' || h === 'link' || h === 'product url') {
      map.url = index;
    }
  });
  return map;
}

function rowToCompetitor(
  row: unknown[],
  colMap: Record<string, number>
): CompetitorRow | null {
  if (colMap.productId === undefined) return null;
  const productId = normalizeId(row[colMap.productId]);
  if (!productId) return null;

  return {
    productId,
    title: String(row[colMap.title] ?? '').trim(),
    salePrice: toNumber(row[colMap.salePrice]),
    regularPrice: toNumber(row[colMap.regularPrice]),
    stock: Math.floor(toNumber(row[colMap.stock])),
    url: String(row[colMap.url] ?? '').trim(),
  };
}

/**
 * Parse CSV/XLSX workbook. Each sheet becomes its own competitor map.
 * Keys are normalized product IDs for O(1) lookup.
 */
export function parseCompetitorWorkbook(buffer: ArrayBuffer): {
  scrapedData: ScrapedData;
  sheetNames: string[];
} {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const scrapedData: ScrapedData = {};
  const sheetNames: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });

    if (!rows.length) continue;

    const headers = (rows[0] as unknown[]).map((h) => String(h ?? ''));
    const colMap = resolveColumnMap(headers);
    if (colMap.productId === undefined) continue;

    const productMap: Record<string, CompetitorRow> = {};
    for (let i = 1; i < rows.length; i++) {
      const parsed = rowToCompetitor(rows[i] as unknown[], colMap);
      if (!parsed) continue;
      // Keep first occurrence per product ID
      if (!productMap[parsed.productId]) {
        productMap[parsed.productId] = parsed;
      }
    }

    scrapedData[sheetName] = productMap;
    sheetNames.push(sheetName);
  }

  return { scrapedData, sheetNames };
}

/** Build competitor list for one product from all sheets */
export function getCompetitorsForProduct(
  productId: string,
  scrapedData: ScrapedData,
  sheetNames: string[],
  currentSalePrice: number
): CompetitorMatch[] {
  const id = normalizeId(productId);
  const list: CompetitorMatch[] = [];

  for (const name of sheetNames) {
    const row = scrapedData[name]?.[id];
    if (!row) continue;
    list.push({
      name,
      title: row.title,
      salePrice: row.salePrice,
      regularPrice: row.regularPrice,
      stock: row.stock,
      url: row.url,
      diff: Number((currentSalePrice - row.salePrice).toFixed(2)),
    });
  }

  return list;
}

/**
 * Lowest sale price logic:
 * 1) Prefer Sale Price > 0 AND Stock > 0, sort ascending, pick lowest
 * 2) Fallback: Sale Price > 0 only (any stock), pick lowest
 */
export function pickLowestCompetitor(
  competitors: CompetitorMatch[]
): CompetitorMatch | null {
  const withStock = competitors
    .filter((c) => c.salePrice > 0 && c.stock > 0)
    .sort((a, b) => a.salePrice - b.salePrice);

  if (withStock.length > 0) return withStock[0];

  const anySale = competitors
    .filter((c) => c.salePrice > 0)
    .sort((a, b) => a.salePrice - b.salePrice);

  return anySale[0] ?? null;
}

export function formatMoney(value: number | undefined | null): string {
  const n = Number(value) || 0;
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calcMargins(salePrice: number, netCost: number) {
  const marginDollar = Number((salePrice - netCost).toFixed(2));
  const marginPercent =
    salePrice > 0 ? Number(((marginDollar / salePrice) * 100).toFixed(2)) : 0;
  return { marginDollar, marginPercent };
}

/**
 * Price Match Margin — difference between New Price and Current Sale Price.
 * NOT a profit margin (does not use cost / net cost / MAP).
 *
 * Margin($) = New Price - Current Sale Price
 * Margin(%) = ((New Price - Current Sale Price) / Current Sale Price) × 100
 */
export function calcPriceMatchMargins(
  newPrice: number | undefined | null,
  currentSalePrice: number
): { percent: number | null; dollar: number | null } {
  if (newPrice == null || !Number.isFinite(Number(newPrice))) {
    return { percent: null, dollar: null };
  }

  const next = Number(newPrice);
  const current = Number(currentSalePrice) || 0;
  const dollar = Number((next - current).toFixed(2));
  const percent =
    current > 0 ? Number((((next - current) / current) * 100).toFixed(2)) : null;

  return { percent, dollar };
}

/** Format Price Match Margin($) like the old module: $-150.00 */
export function formatPriceMatchMarginDollar(value: number): string {
  const n = Number(value.toFixed(2));
  if (n < 0) return `$-${Math.abs(n).toFixed(2)}`;
  return `$${n.toFixed(2)}`;
}

/** Color class for Price Match Margin values */
export function priceMatchMarginColorClass(dollar: number | null): string {
  if (dollar == null) return 'text-gray-500';
  if (dollar > 0) return 'text-green-600';
  if (dollar < 0) return 'text-red-500';
  return 'text-gray-800';
}

/** Prefer PriorityTire sheet when setting priority prices */
export function findPrioritySheetName(sheetNames: string[]): string | null {
  const exact = sheetNames.find(
    (n) => normalizeId(n) === 'prioritytire' || normalizeId(n) === 'priority'
  );
  if (exact) return exact;
  return (
    sheetNames.find((n) => normalizeId(n).includes('priority')) ?? null
  );
}

/** Short label for bulk buttons: PriorityTire → Priority */
export function competitorShortName(sheetName: string): string {
  const n = sheetName.trim();
  if (/^priority/i.test(n)) return 'Priority';
  return n;
}

export interface CompetitorTheme {
  /** Tailwind / arbitrary bg class for selected buttons & bulk actions */
  bg: string;
  hover: string;
  inactive: string;
  /** Exact hex for selected price pills (matches screenshots) */
  hex: string;
}

const COMPETITOR_THEMES: CompetitorTheme[] = [
  // Priority — vibrant blue
  {
    bg: 'bg-[#0d6efd]',
    hover: 'hover:bg-[#0b5ed7]',
    inactive: 'bg-gray-300 hover:bg-gray-400',
    hex: '#0d6efd',
  },
  // SimpleTire — muted purple / plum
  {
    bg: 'bg-[#7D5A8C]',
    hover: 'hover:bg-[#6a4c77]',
    inactive: 'bg-gray-300 hover:bg-gray-400',
    hex: '#7D5A8C',
  },
  // TiresEasy — rose / muted red
  {
    bg: 'bg-[#C05E63]',
    hover: 'hover:bg-[#a84f54]',
    inactive: 'bg-gray-300 hover:bg-gray-400',
    hex: '#C05E63',
  },
  // TireAgent — turquoise / teal
  {
    bg: 'bg-[#2ec4b6]',
    hover: 'hover:bg-[#25a99d]',
    inactive: 'bg-gray-300 hover:bg-gray-400',
    hex: '#2ec4b6',
  },
  // Extra competitors (cycle)
  {
    bg: 'bg-indigo-500',
    hover: 'hover:bg-indigo-600',
    inactive: 'bg-gray-300 hover:bg-gray-400',
    hex: '#6366f1',
  },
  {
    bg: 'bg-amber-600',
    hover: 'hover:bg-amber-700',
    inactive: 'bg-gray-300 hover:bg-gray-400',
    hex: '#d97706',
  },
];

/** Stable color theme per competitor sheet name */
export function getCompetitorTheme(sheetName: string, sheetNames: string[]): CompetitorTheme {
  const key = normalizeId(sheetName);
  if (key.includes('priority')) return COMPETITOR_THEMES[0];
  if (key.includes('simple')) return COMPETITOR_THEMES[1];
  if (key.includes('tireseasy') || key.includes('tires easy') || key.includes('easy')) {
    return COMPETITOR_THEMES[2];
  }
  if (key.includes('tireagent') || key.includes('tire agent') || key.includes('agent')) {
    return COMPETITOR_THEMES[3];
  }

  const idx = Math.max(0, sheetNames.indexOf(sheetName));
  return COMPETITOR_THEMES[idx % COMPETITOR_THEMES.length];
}

/** Column labels matching screenshots (e.g. Priority Sale Price, Simple Price) */
export function competitorPriceColumnLabel(sheetName: string): string {
  const short = competitorShortName(sheetName);
  if (/^priority$/i.test(short)) return 'Priority Sale Price';
  if (/^simple/i.test(short)) return 'Simple Price';
  return `${short} Price`;
}

export function competitorRegularColumnLabel(sheetName: string): string {
  const short = competitorShortName(sheetName);
  if (/^priority$/i.test(short)) return 'Priority Regular Price';
  if (/^simple/i.test(short)) return 'Simple Regular Price';
  return `${short} Regular Price`;
}

/** Shared class for unselected price pills */
export const COMPETITOR_PRICE_BTN_IDLE =
  'inline-flex items-center justify-center min-w-[64px] px-3 py-1.5 rounded-lg text-sm font-bold bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 transition-all';

/** Shared class for selected price pills (color applied via style backgroundColor) */
export const COMPETITOR_PRICE_BTN_ACTIVE =
  'inline-flex items-center justify-center min-w-[64px] px-3 py-1.5 rounded-lg text-sm font-bold text-white border border-transparent shadow-md transition-all';


export function productMatchesSearch(
  product: CompetitorProduct,
  search: string
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    product.sku?.toLowerCase().includes(q) ||
    product.brand?.toLowerCase().includes(q) ||
    product.model?.toLowerCase().includes(q) ||
    product.tireSize?.toLowerCase().includes(q) ||
    product.id?.toLowerCase().includes(q)
  );
}

export function isInDateRange(
  updatedAt: string,
  startDate: string,
  endDate: string
): boolean {
  if (!startDate && !endDate) return true;
  const t = new Date(updatedAt).getTime();
  if (Number.isNaN(t)) return false;
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (t < start.getTime()) return false;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (t > end.getTime()) return false;
  }
  return true;
}

/**
 * Return only the newest priceHistory entry for the selected type.
 * Sort once by updatedAt descending and take the first record.
 */
export function getLatestHistory(
  priceHistory: PriceHistoryEntry[] | undefined | null,
  selectedType: 'sale' | 'regular'
): PriceHistoryEntry | null {
  if (!priceHistory?.length) return null;

  const filtered = priceHistory.filter((item) => item.type === selectedType);
  if (filtered.length === 0) return null;

  filtered.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return filtered[0];
}

/**
 * Build Price Match Summary rows: one product = one row (latest history only).
 */
export function buildLatestPriceSummaryRows(
  products: ProductWithPriceHistory[],
  selectedType: 'sale' | 'regular'
): PriceUpdateHistoryRow[] {
  const rows: PriceUpdateHistoryRow[] = [];

  for (const product of products) {
    const latest = getLatestHistory(product.priceHistory, selectedType);
    if (!latest) continue;

    rows.push({
      id: latest.id,
      productId: product.productId,
      sku: product.sku,
      brand: product.brand,
      model: product.model,
      productName: product.productName,
      cost: product.cost,
      salePrice: product.salePrice,
      mapPrice: product.mapPrice,
      regularPrice: product.regularPrice,
      stock: product.stock,
      previousPrice: latest.previousPrice,
      updatedPrice: latest.updatedPrice,
      competitor: latest.competitor,
      date: latest.updatedAt,
      priceType: selectedType === 'regular' ? 'REGULAR' : 'SALE',
    });
  }

  return rows;
}

