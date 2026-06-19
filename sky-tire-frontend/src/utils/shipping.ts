import axios from 'axios';
import { ShippingCategory, ShippingAccessoryCategory } from '@/redux/types/shippingTypes';

export function formatShippingDimensions(length: number, width: number, height: number): string {
  return `${length}x${width}x${height}`;
}

export interface ShippingLookupResult {
  weight: number;
  length: number;
  width: number;
  height: number;
  shippingRate: number;
}

export async function lookupShippingBySize(
  category: ShippingCategory,
  size: string,
): Promise<ShippingLookupResult | null> {
  const trimmed = size.trim();
  if (!trimmed) return null;

  try {
    const response = await axios.get('/api/admin/shipping/lookup', {
      params: { category, size: trimmed },
    });
    return response.data ?? null;
  } catch {
    return null;
  }
}

export async function lookupShippingByAccessoryCategory(
  accessoryCategory: ShippingAccessoryCategory,
): Promise<ShippingLookupResult | null> {
  try {
    const response = await axios.get('/api/admin/shipping/lookup', {
      params: { category: 'ACCESSORY', accessoryCategory },
    });
    return response.data ?? null;
  } catch {
    return null;
  }
}

export interface ShippingAutoFillFields {
  weight: string;
  shippingDimensions: string;
  internalShipping: string;
}

export function mapShippingToProductFields(record: ShippingLookupResult): ShippingAutoFillFields {
  return {
    weight: String(record.weight),
    shippingDimensions: formatShippingDimensions(record.length, record.width, record.height),
    internalShipping: record.shippingRate.toFixed(2),
  };
}
