export type CouponDiscountType = 'percentage' | 'fixed';

export type CouponAppliesTo =
  | 'all'
  | 'specific_products'
  | 'specific_brands'
  | 'all_tires'
  | 'all_wheels'
  | 'all_wire_wheels'
  | 'all_bolt_on_wire_wheels'
  | 'all_black_wall_tires'
  | 'all_white_wall_tires'
  | 'all_accessories';

export type CouponStatus = 'active' | 'inactive';

export const DISCOUNT_TYPE_OPTIONS: { value: CouponDiscountType; label: string }[] = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed' },
];

export const STACKING_RULE_OPTIONS = [
  { key: 'combineWithOtherCoupons', label: 'Can be Combined With Other Coupons' },
  { key: 'combineWithFinancing', label: 'Can be Combined With Financing' },
  { key: 'combineWithFreeShipping', label: 'Can be Combined With Free Shipping' },
  { key: 'exclusiveCoupon', label: 'Exclusive Coupon' },
] as const;

export type StackingRuleKey = (typeof STACKING_RULE_OPTIONS)[number]['key'];

export function formatStackingRules(coupon: {
  combineWithOtherCoupons: boolean;
  combineWithFinancing: boolean;
  combineWithFreeShipping: boolean;
  exclusiveCoupon: boolean;
}): string {
  const active = STACKING_RULE_OPTIONS.filter(
    (opt) => coupon[opt.key as StackingRuleKey]
  ).map((opt) => opt.label);
  return active.length > 0 ? active.join(', ') : 'None';
}

export const APPLIES_TO_GROUPS: {
  label: string;
  options: { value: CouponAppliesTo; label: string }[];
}[] = [
  {
    label: 'General Options',
    options: [
      { value: 'all', label: 'All Products' },
      { value: 'specific_brands', label: 'Specific Brands' },
      { value: 'specific_products', label: 'Specific Products' },
    ],
  },
  {
    label: 'Tire Options',
    options: [
      { value: 'all_tires', label: 'All Tires' },
      { value: 'all_black_wall_tires', label: 'All Black Wall Tires' },
      { value: 'all_white_wall_tires', label: 'All White Wall Tires' },
    ],
  },
  {
    label: 'Wheels Options',
    options: [
      { value: 'all_wheels', label: 'All Wheels' },
      { value: 'all_wire_wheels', label: 'All Wire Wheels' },
      { value: 'all_bolt_on_wire_wheels', label: 'Bolt On Wire Wheel' },
    ],
  },
  {
    label: 'Accessories Options',
    options: [{ value: 'all_accessories', label: 'Accessories' }],
  },
];

export const APPLIES_TO_LABELS: Record<CouponAppliesTo, string> = APPLIES_TO_GROUPS.flatMap(
  (g) => g.options
).reduce(
  (acc, opt) => {
    acc[opt.value] = opt.label;
    return acc;
  },
  {} as Record<CouponAppliesTo, string>
);

export const ALL_APPLIES_TO_OPTIONS: { value: CouponAppliesTo; label: string }[] =
  APPLIES_TO_GROUPS.flatMap((g) => g.options);

export const ALL_APPLIES_TO_VALUES: CouponAppliesTo[] = ALL_APPLIES_TO_OPTIONS.map(
  (o) => o.value
);

export function formatAppliesToLabels(values: CouponAppliesTo[]): string {
  if (values.length === 0) return '—';
  return values.map((v) => APPLIES_TO_LABELS[v]).join(', ');
}

export function generateCouponCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
