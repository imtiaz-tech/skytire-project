import { ShippingCategory } from '@/redux/types/shippingTypes';

export const SHIPPING_CATEGORIES: ShippingCategory[] = [
  'TIRE',
  'WHEEL',
  'WIRE_WHEEL',
  'BOLT_ON_WIRE_WHEEL',
];

export interface ShippingInput {
  category?: string;
  size?: string;
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

export function validateShippingInput(data: ShippingInput, isUpdate = false) {
  const errors: string[] = [];

  if (!isUpdate && (!data.category || !isValidShippingCategory(data.category))) {
    errors.push('Valid category is required');
  }

  if (!data.size || !String(data.size).trim()) {
    errors.push('Size is required');
  }

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

  if (errors.length > 0) {
    return { valid: false as const, errors };
  }

  return {
    valid: true as const,
    data: {
      category: data.category as ShippingCategory,
      size: String(data.size).trim(),
      weight: weight as number,
      length: length as number,
      width: width as number,
      height: height as number,
      shippingRate: shippingRate as number,
    },
  };
}

export function buildShippingSearchWhere(category: ShippingCategory, search: string) {
  const trimmed = search.trim();
  if (!trimmed) {
    return { category };
  }

  const orConditions: Record<string, unknown>[] = [
    { size: { contains: trimmed, mode: 'insensitive' } },
  ];

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

  return {
    category,
    OR: orConditions,
  };
}
