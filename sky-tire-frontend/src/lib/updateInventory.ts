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
  reason: string;
};

export type InventorySummary = {
  id: string;
  updatedProducts: UpdatedProduct[];
  notFoundProducts: NotFoundProduct[];
  inventoryType: string | null;
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
  return `$${Number(value).toFixed(2)}`;
}

export function inventoryTypeLabel(type: string | null | undefined): string {
  const found = INVENTORY_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label || type || 'N/A';
}
