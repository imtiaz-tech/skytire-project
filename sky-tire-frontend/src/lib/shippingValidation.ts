import { ShippingCategory } from '@/redux/types/shippingTypes';

export const SHIPPING_CATEGORIES: ShippingCategory[] = [
  'TIRE',
  'WHEEL',
  'WIRE_WHEEL',
  'BOLT_ON_WIRE_WHEEL',
  'ACCESSORY',
];

export interface ShippingInput {
  category?: string;
  size?: string;
  accessoryCategoryId?: string;
  weight?: unknown;
  length?: unknown;
  width?: unknown;
  height?: unknown;
  shippingRate?: unknown;
}

export function isValidShippingCategory(value: string): value is ShippingCategory {
  return SHIPPING_CATEGORIES.includes(value as ShippingCategory);
}

export function parsePositiveNumber(value: unknown, fieldName: string): number | string {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isNaN(num) || num <= 0) {
    return `${fieldName} must be a positive number`;
  }
  return num;
}

function validateNumericFields(data: ShippingInput, errors: string[]) {
  const weight = parsePositiveNumber(data.weight, 'Weight');
  if (typeof weight === 'string') errors.push(weight);

  const length = parsePositiveNumber(data.length, 'Length');
  if (typeof length === 'string') errors.push(length);

  const width = parsePositiveNumber(data.width, 'Width');
  if (typeof width === 'string') errors.push(width);

  const height = parsePositiveNumber(data.height, 'Height');
  if (typeof height === 'string') errors.push(height);

  const shippingRate = parsePositiveNumber(data.shippingRate, 'Shipping rate');
  if (typeof shippingRate === 'string') errors.push(shippingRate);

  return { weight, length, width, height, shippingRate };
}

export function validateShippingInput(data: ShippingInput, isUpdate = false) {
  const errors: string[] = [];
  const category = data.category as ShippingCategory | undefined;

  if (!isUpdate && (!category || !isValidShippingCategory(category))) {
    errors.push('Valid category is required');
  }

  const numeric = validateNumericFields(data, errors);

  if (errors.length > 0) {
    return { valid: false as const, errors };
  }

  const resolvedCategory = category!;

  if (resolvedCategory === 'ACCESSORY') {
    if (!data.accessoryCategoryId || !String(data.accessoryCategoryId).trim()) {
      errors.push('Accessory category is required');
    }
  } else if (!data.size || !String(data.size).trim()) {
    errors.push('Size is required');
  }

  if (errors.length > 0) {
    return { valid: false as const, errors };
  }

  if (resolvedCategory === 'ACCESSORY') {
    return {
      valid: true as const,
      data: {
        category: resolvedCategory,
        size: null,
        accessoryCategoryId: String(data.accessoryCategoryId).trim(),
        weight: numeric.weight as number,
        length: numeric.length as number,
        width: numeric.width as number,
        height: numeric.height as number,
        shippingRate: numeric.shippingRate as number,
      },
    };
  }

  return {
    valid: true as const,
    data: {
      category: resolvedCategory,
      size: String(data.size).trim(),
      accessoryCategoryId: null,
      weight: numeric.weight as number,
      length: numeric.length as number,
      width: numeric.width as number,
      height: numeric.height as number,
      shippingRate: numeric.shippingRate as number,
    },
  };
}

export function buildShippingSearchWhere(category: ShippingCategory, search: string) {
  const trimmed = search.trim();
  if (!trimmed) {
    return { category };
  }

  const orConditions: Record<string, unknown>[] = [];

  if (category === 'ACCESSORY') {
    orConditions.push({
      accessoryCategory: { name: { contains: trimmed, mode: 'insensitive' } },
    });
  } else {
    orConditions.push({ size: { contains: trimmed, mode: 'insensitive' } });
  }

  const num = parseFloat(trimmed);
  if (!Number.isNaN(num)) {
    orConditions.push(
      { weight: num },
      { length: num },
      { width: num },
      { height: num },
      { shippingRate: num },
    );
  }

  if (orConditions.length === 0) {
    return { category };
  }

  return {
    category,
    OR: orConditions,
  };
}
