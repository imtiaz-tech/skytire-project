export type ShippingCategory =
  | 'TIRE'
  | 'WHEEL'
  | 'WIRE_WHEEL'
  | 'BOLT_ON_WIRE_WHEEL'
  | 'ACCESSORY';

export interface Shipping {
  id: string;
  category: ShippingCategory;
  size: string | null;
  accessoryCategoryId: string | null;
  accessoryCategory?: {
    id: string;
    name: string;
  } | null;
  weight: number;
  length: number;
  width: number;
  height: number;
  shippingRate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingState {
  shippings: Shipping[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}

export interface ShippingFormData {
  size: string;
  accessoryCategoryId: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  shippingRate: string;
}

export const SHIPPING_TAB_LABELS: Record<ShippingCategory, string> = {
  TIRE: 'Tires',
  WHEEL: 'Wheels',
  WIRE_WHEEL: 'Wire Wheels',
  BOLT_ON_WIRE_WHEEL: 'Bolt On Wire Wheels',
  ACCESSORY: 'Accessories',
};

export function isAccessoryShippingCategory(category: ShippingCategory): boolean {
  return category === 'ACCESSORY';
}
