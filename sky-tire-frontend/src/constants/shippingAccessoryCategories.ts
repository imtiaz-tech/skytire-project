import { ACCESSORY_CATEGORIES } from '@/constants/accessoryCategories';
import { ShippingAccessoryCategory } from '@/redux/types/shippingTypes';

export const SHIPPING_ACCESSORY_OPTIONS: {
  value: ShippingAccessoryCategory;
  label: (typeof ACCESSORY_CATEGORIES)[number];
}[] = [
  { value: 'LOWRIDER_ADAPTERS', label: 'Lowrider Adapters' },
  { value: 'LOWRIDER_KNOCK_OFFS', label: 'Lowrider Knock Offs' },
  { value: 'LOWRIDER_TOOLS', label: 'Lowrider Tools' },
];

export const ACCESSORY_LABEL_TO_ENUM: Record<string, ShippingAccessoryCategory> = {
  'Lowrider Adapters': 'LOWRIDER_ADAPTERS',
  'Lowrider Knock Offs': 'LOWRIDER_KNOCK_OFFS',
  'Lowrider Tools': 'LOWRIDER_TOOLS',
};

export const ACCESSORY_ENUM_TO_LABEL: Record<ShippingAccessoryCategory, string> = {
  LOWRIDER_ADAPTERS: 'Lowrider Adapters',
  LOWRIDER_KNOCK_OFFS: 'Lowrider Knock Offs',
  LOWRIDER_TOOLS: 'Lowrider Tools',
};

export function isShippingAccessoryCategory(value: string): value is ShippingAccessoryCategory {
  return ['LOWRIDER_ADAPTERS', 'LOWRIDER_KNOCK_OFFS', 'LOWRIDER_TOOLS'].includes(value);
}

export function accessoryLabelToEnum(label: string): ShippingAccessoryCategory | null {
  return ACCESSORY_LABEL_TO_ENUM[label] ?? null;
}

export function isAutoFillAccessoryCategory(label: string): boolean {
  return label in ACCESSORY_LABEL_TO_ENUM;
}
