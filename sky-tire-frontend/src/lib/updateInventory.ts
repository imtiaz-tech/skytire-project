import * as XLSX from 'xlsx';

export type InventoryTypeOption =
  | 'tire'
  | 'wheel'
  | 'wireWheel'
  | 'boltOnWheel'
  | 'accessory';

export const INVENTORY_TYPE_OPTIONS: { value: InventoryTypeOption; label: string }[] = [
  { value: 'tire', label: 'Tires' },
  { value: 'wheel', label: 'Wheels' },
  { value: 'wireWheel', label: 'Wire Wheels' },
  { value: 'boltOnWheel', label: 'Bolt On Wheels' },
  { value: 'accessory', label: 'Accessories' },
];

export type SelectedFieldsState = {
  SKU: string;
  Brand: string;
  Cost: string;
  IncreaseCost: boolean;
  DecreaseCost: boolean;
  MAP: string;
  Stock: string;
  SalePrice: string;
  RegularPrice: string;
  inventoryType: string;
  source: string;
};

export type CheckedStates = {
  Brand: boolean;
  Cost: boolean;
  Stock: boolean;
  MAP: boolean;
  SalePrice: boolean;
  RegularPrice: boolean;
  IncreaseCost: boolean;
  DecreaseCost: boolean;
};

export type UpdatedProduct = {
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

export type NotFoundProduct = {
  sku: string;
  brand?: string | null;
  /** Full skip message shown in the Reason column */
  reason: string;
  /** Product size from the uploaded file */
  description?: string;
  /** Stock value from the uploaded file */
  stock?: number | string | null;
  /** Inventory type label (Tire, Wheels, etc.) */
  category?: string | null;
  /** Exact row from the uploaded file (original column names/values) */
  originalRow?: Record<string, unknown> | null;
};

export type InventorySummary = {
  id: string;
  updatedProducts: UpdatedProduct[];
  notFoundProducts: NotFoundProduct[];
  inventoryType: string | null;
  sourceName?: string | null;
  uploadColumns?: string[] | null;
  timestamp: string;
  createdBy?: { id: number; name: string; email: string } | null;
};

export function parseInventoryFile(file: File): Promise<{
  columnNames: string[];
  sampleRow: unknown[];
  previewRows: Record<string, unknown>[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file'));
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('Workbook has no sheets'));
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        });
        const headerRow = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: '',
        })[0] as string[] | undefined;

        const columnNames = (headerRow || Object.keys(rows[0] || {})).map((h) =>
          String(h ?? '').trim()
        ).filter(Boolean);

        const first = rows[0] || {};
        const sampleRow = columnNames.map((col) => first[col] ?? 'N/A');

        const previewRows = rows.slice(0, 10).map((row) => {
          const obj: Record<string, unknown> = {};
          columnNames.forEach((col) => {
            obj[col] = row[col] ?? '';
          });
          return obj;
        });

        resolve({ columnNames, sampleRow, previewRows });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function isUpdateButtonDisabled(
  checkedStates: CheckedStates,
  selectedFields: SelectedFieldsState
): boolean {
  const isCostChecked = checkedStates.Cost;
  const isMAPChecked = checkedStates.MAP;
  const isStockChecked = checkedStates.Stock;
  const isSKUSelected = !!selectedFields.SKU;
  const isCostSelected = !!selectedFields.Cost;
  const isMAPSelected = !!selectedFields.MAP;
  const isStockSelected = !!selectedFields.Stock;
  const isInventoryTypeSelected = !!selectedFields.inventoryType;
  const isInventorySourceSelected = !!selectedFields.source;

  if (!isSKUSelected || !isInventoryTypeSelected || !isInventorySourceSelected) {
    return true;
  }

  if (
    !isCostChecked &&
    !isMAPChecked &&
    !isStockChecked &&
    isCostSelected &&
    isMAPSelected &&
    isStockSelected
  ) {
    return false;
  }

  if (!isCostChecked && !isStockChecked && isCostSelected && isStockSelected) {
    return false;
  }

  if (!isCostChecked && !isMAPChecked && isCostSelected && isMAPSelected) {
    return false;
  }

  if (!isMAPChecked && !isStockChecked && isMAPSelected && isStockSelected) {
    return false;
  }

  if (!isCostChecked && isCostSelected) return false;
  if (!isMAPChecked && isMAPSelected) return false;
  if (!isStockChecked && isStockSelected) return false;

  return true;
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '-';
  return `$ ${Number(value).toFixed(2)}`;
}

export function inventoryTypeLabel(type: string | null | undefined): string {
  const found = INVENTORY_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label || type || 'N/A';
}

/** Singular label for summary header, e.g. "Tire" */
export function inventoryTypeSingular(type: string | null | undefined): string {
  switch (type) {
    case 'tire':
      return 'Tire';
    case 'wheel':
      return 'Wheel';
    case 'wireWheel':
      return 'Wire Wheel';
    case 'boltOnWheel':
      return 'Bolt On Wheel';
    case 'accessory':
      return 'Accessory';
    default:
      return inventoryTypeLabel(type);
  }
}

export type UpdateFilterType = 'cost' | 'price' | 'map' | 'stock';

export const UPDATE_FILTER_OPTIONS: {
  key: UpdateFilterType;
  label: string;
  modalTitle: string;
  borderClass: string;
  textClass: string;
}[] = [
  {
    key: 'cost',
    label: 'Cost Changes',
    modalTitle: 'Products with Updated Cost',
    borderClass: 'border-blue-500',
    textClass: 'text-blue-600',
  },
  {
    key: 'price',
    label: 'Price Changes',
    modalTitle: 'Products with Updated Price',
    borderClass: 'border-purple-500',
    textClass: 'text-purple-600',
  },
  {
    key: 'map',
    label: 'MAP Changes',
    modalTitle: 'Products with Updated MAP',
    borderClass: 'border-cyan-500',
    textClass: 'text-cyan-600',
  },
  {
    key: 'stock',
    label: 'Stock Changes',
    modalTitle: 'Products with Updated Stock',
    borderClass: 'border-[#1e2a4a]',
    textClass: 'text-[#1e2a4a]',
  },
];

export function hasCostChange(p: UpdatedProduct): boolean {
  return Number(p.prevCost) !== Number(p.cost);
}

export function hasPriceChange(p: UpdatedProduct): boolean {
  return Number(p.priceChanged) !== 0 || Number(p.prevPrice) !== Number(p.price);
}

export function hasMapChange(p: UpdatedProduct): boolean {
  return Boolean(p.mapChanged) || Number(p.prevMap) !== Number(p.map);
}

export function hasStockChange(p: UpdatedProduct): boolean {
  return p.stockStatus !== 'nochange' || Number(p.prevStock) !== Number(p.stock);
}

export function filterUpdatedProducts(
  products: UpdatedProduct[],
  filter: UpdateFilterType | null
): UpdatedProduct[] {
  if (!filter) return products;
  switch (filter) {
    case 'cost':
      return products.filter(hasCostChange);
    case 'price':
      return products.filter(hasPriceChange);
    case 'map':
      return products.filter(hasMapChange);
    case 'stock':
      return products.filter(hasStockChange);
    default:
      return products;
  }
}

export function searchUpdatedProducts(
  products: UpdatedProduct[],
  query: string
): UpdatedProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.sku?.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q)
  );
}

export function searchNotFoundProducts(
  products: NotFoundProduct[],
  query: string
): NotFoundProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.sku?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.reason?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      String(p.stock ?? '')
        .toLowerCase()
        .includes(q)
  );
}

export function getSkippedDescription(
  reason: string,
  inventoryType?: string | null
): string {
  const label = inventoryTypeSingular(inventoryType);
  const r = (reason || '').toLowerCase();
  if (r.includes('product not found') || r.includes('was not found in inventory')) {
    return `${label} was not found in inventory. Create the product or verify the SKU.`;
  }
  if (r.includes('missing sku')) {
    return `${label} row was skipped because the SKU is missing.`;
  }
  if (r.includes('brand mismatch')) {
    return `${label} brand does not match the brand mapped from the file.`;
  }
  if (r.includes('invalid stock')) {
    return `${label} stock value is invalid and could not be applied.`;
  }
  if (r.includes('sale price') && r.includes('below cost')) {
    return `${label} sale price is below cost and was skipped.`;
  }
  return reason || `${label} was skipped during inventory update.`;
}

export function getSkippedMeta(
  reason: string,
  inventoryType?: string | null
): {
  category: string;
  suggestion: string;
} {
  const typeCategory = inventoryTypeLabel(inventoryType);
  const r = (reason || '').toLowerCase();
  if (r.includes('product not found') || r.includes('was not found in inventory')) {
    return {
      category: typeCategory,
      suggestion: 'Product may need to be created',
    };
  }
  if (r.includes('missing sku')) {
    return {
      category: typeCategory,
      suggestion: 'Ensure SKU column is mapped',
    };
  }
  if (r.includes('brand mismatch')) {
    return {
      category: typeCategory,
      suggestion: 'Verify brand column matches the product brand',
    };
  }
  if (r.includes('invalid stock')) {
    return {
      category: typeCategory,
      suggestion: 'Provide a valid numeric stock value',
    };
  }
  if (r.includes('sale price') && r.includes('below cost')) {
    return {
      category: typeCategory,
      suggestion: 'Raise sale price so it is not below cost',
    };
  }
  return {
    category: typeCategory,
    suggestion: 'Review the row and try again',
  };
}

/** Read size from an uploaded inventory row (common column names). */
export function extractSizeFromUploadRow(
  row: Record<string, unknown> | null | undefined,
  columns?: string[] | null
): string {
  if (!row) return '';
  const cols = (columns && columns.length > 0 ? columns : Object.keys(row)).map(
    (c) => String(c)
  );
  const preferred = [
    'size',
    'tire size',
    'tire_size',
    'tiresize',
    'wheel size',
    'wheel_size',
    'wheelsize',
    'product size',
    'product_size',
  ];
  for (const col of cols) {
    if (preferred.includes(col.trim().toLowerCase())) {
      const v = row[col]?.toString().trim();
      if (v) return v;
    }
  }
  for (const col of cols) {
    if (/size/i.test(col) && !/resize|ssize/i.test(col)) {
      const v = row[col]?.toString().trim();
      if (v) return v;
    }
  }
  return '';
}

/** Read stock from an uploaded inventory row. */
export function extractStockFromUploadRow(
  row: Record<string, unknown> | null | undefined,
  stockColumn?: string | null,
  columns?: string[] | null
): string | number | null {
  if (!row) return null;
  if (stockColumn && row[stockColumn] !== undefined && row[stockColumn] !== null) {
    const v = row[stockColumn]?.toString().trim();
    if (v !== '') return v;
  }
  const cols = (columns && columns.length > 0 ? columns : Object.keys(row)).map(
    (c) => String(c)
  );
  for (const col of cols) {
    if (/^stock$/i.test(col.trim()) || /^qty$/i.test(col.trim()) || /^quantity$/i.test(col.trim())) {
      const v = row[col]?.toString().trim();
      if (v !== '') return v;
    }
  }
  return null;
}

export function downloadSkippedProductsFile(
  products: NotFoundProduct[],
  options: {
    sourceName?: string | null;
    uploadColumns?: string[] | null;
    format: 'csv' | 'xlsx';
  }
) {
  const sourceLabel = (options.sourceName || 'Inventory').trim() || 'Inventory';

  const columnsFromOptions = Array.isArray(options.uploadColumns)
    ? options.uploadColumns.filter(Boolean)
    : [];

  const columnsFromRows = (() => {
    const firstWithRow = products.find(
      (p) => p.originalRow && typeof p.originalRow === 'object'
    );
    return firstWithRow?.originalRow ? Object.keys(firstWithRow.originalRow) : [];
  })();

  const columns =
    columnsFromOptions.length > 0 ? columnsFromOptions : columnsFromRows;

  const hasOriginalRows = products.some(
    (p) => p.originalRow && typeof p.originalRow === 'object'
  );

  let rows: Record<string, unknown>[];

  if (hasOriginalRows && columns.length > 0) {
    rows = products.map((p) => {
      const out: Record<string, unknown> = {};
      for (const col of columns) {
        out[col] = p.originalRow?.[col] ?? '';
      }
      return out;
    });
  } else {
    // Fallback for older summaries that don't include original upload rows
    rows = products.map((p) => ({
      SKU: p.sku || 'N/A',
      Brand: p.brand || '-',
      Reason: p.reason,
      Description: p.description || '',
    }));
  }

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: hasOriginalRows && columns.length > 0 ? columns : undefined,
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Skipped Products');
  const safeName = sourceLabel.replace(/[\\/:*?"<>|]+/g, '-').trim();
  const filename = `${safeName} - Skipped Products.${options.format}`;
  XLSX.writeFile(workbook, filename, {
    bookType: options.format === 'csv' ? 'csv' : 'xlsx',
  });
}

export function computeSummaryStats(
  updated: UpdatedProduct[],
  skipped: NotFoundProduct[]
) {
  const totalUpdated = updated.length;
  const totalSkipped = skipped.length;
  const totalProcessed = totalUpdated + totalSkipped;
  const successRate =
    totalProcessed > 0 ? Math.round((totalUpdated / totalProcessed) * 100) : 0;

  const costChanged = updated.filter(hasCostChange);
  const priceChanged = updated.filter(hasPriceChange);
  const mapChanged = updated.filter(hasMapChange);
  const stockChanged = updated.filter(hasStockChange);

  const costDeltas = costChanged.map((p) => Number(p.cost) - Number(p.prevCost));
  const avgCostChange =
    costDeltas.length > 0
      ? costDeltas.reduce((a, b) => a + b, 0) / costDeltas.length
      : 0;

  return {
    totalUpdated,
    totalSkipped,
    totalProcessed,
    successRate,
    priceChanges: priceChanged.length,
    costChanges: costChanged.length,
    mapChanges: mapChanged.length,
    stockChanges: stockChanged.length,
    avgCostChange,
  };
}

export function formatRelativeTime(timestamp: string | Date | null | undefined): string {
  if (!timestamp) return 'Latest run';
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (Number.isNaN(date.getTime())) return 'Latest run';

  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? '' : 's'} ago`;
}

