export const COUPON_CATEGORY_TABS = [
  { key: 'tires', label: 'Tires', brandCategory: 'tire' },
  { key: 'wheels', label: 'Wheels', brandCategory: 'wheel' },
  { key: 'wire_wheels', label: 'Wire Wheels', brandCategory: 'wire_wheel' },
  { key: 'bolt_on_wire_wheels', label: 'Bolt-On Wire Wheels', brandCategory: 'bolt_on_wheels' },
  { key: 'accessories', label: 'Accessories', brandCategory: 'accessory' },
] as const;

export type CouponCategoryKey = (typeof COUPON_CATEGORY_TABS)[number]['key'];

export const DEFAULT_COUPON_CATEGORY: CouponCategoryKey = 'tires';
