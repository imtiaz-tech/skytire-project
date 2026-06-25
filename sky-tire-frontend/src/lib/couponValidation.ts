import {
  CouponAppliesTo,
  CouponDiscountType,
  CouponStatus,
} from '@/constants/couponOptions';
import { roundCurrency } from '@/utils/pricing';
import {
  countProductSelections,
  flattenBrandIds,
  flattenProductSelections,
  hasBrandSelections,
  legacyBrandSelections,
  legacyProductSelections,
  parseBrandSelections,
  parseProductSelections,
  emptyProductSelections,
  emptyBrandSelections,
  CouponBrandSelections,
  CouponProductSelections,
} from '@/types/couponSelections';
import {
  CouponAppliesTo as PrismaAppliesTo,
  CouponDiscountType as PrismaDiscountType,
  CouponStatus as PrismaStatus,
} from '@prisma/client';

const DISCOUNT_TYPE_MAP: Record<CouponDiscountType, PrismaDiscountType> = {
  percentage: 'PERCENTAGE',
  fixed: 'FIXED',
  free_shipping: 'FREE_SHIPPING',
};

const APPLIES_TO_MAP: Record<CouponAppliesTo, PrismaAppliesTo> = {
  all: 'ALL',
  specific_products: 'SPECIFIC_PRODUCTS',
  specific_brands: 'SPECIFIC_BRANDS',
  all_tires: 'ALL_TIRES',
  all_wheels: 'ALL_WHEELS',
  all_wire_wheels: 'ALL_WIRE_WHEELS',
  all_bolt_on_wire_wheels: 'ALL_BOLT_ON_WIRE_WHEELS',
  all_black_wall_tires: 'ALL_BLACK_WALL_TIRES',
  all_white_wall_tires: 'ALL_WHITE_WALL_TIRES',
  all_accessories: 'ALL_ACCESSORIES',
};

const REVERSE_DISCOUNT_TYPE: Record<PrismaDiscountType, CouponDiscountType> = {
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
  FREE_SHIPPING: 'free_shipping',
};

const REVERSE_APPLIES_TO: Record<PrismaAppliesTo, CouponAppliesTo> = {
  ALL: 'all',
  SPECIFIC_PRODUCTS: 'specific_products',
  SPECIFIC_BRANDS: 'specific_brands',
  ALL_TIRES: 'all_tires',
  ALL_WHEELS: 'all_wheels',
  ALL_WIRE_WHEELS: 'all_wire_wheels',
  ALL_BOLT_ON_WIRE_WHEELS: 'all_bolt_on_wire_wheels',
  ALL_BLACK_WALL_TIRES: 'all_black_wall_tires',
  ALL_WHITE_WALL_TIRES: 'all_white_wall_tires',
  ALL_ACCESSORIES: 'all_accessories',
};

const REVERSE_STATUS: Record<PrismaStatus, CouponStatus> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export type CouponFieldErrors = Partial<
  Record<
    | 'code'
    | 'title'
    | 'discountType'
    | 'discountValue'
    | 'stackingRules'
    | 'appliesTo'
    | 'productIds'
    | 'brandIds'
    | 'minQuantity'
    | 'minOrderPrice'
    | 'userUsageLimit'
    | 'couponUsageLimit'
    | 'geographicRestrictions'
    | 'startDate'
    | 'endDate',
    string
  >
>;

function isEmpty(value: unknown): boolean {
  return value == null || value === '';
}

function parseCurrencyValue(value: unknown): number {
  const num = Number(value);
  if (Number.isNaN(num)) return NaN;
  return roundCurrency(num);
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true';
}

function parseRequiredInt(
  value: unknown,
  fieldLabel: string,
  min = 1
): { value: number | null; error: string | null } {
  if (isEmpty(value)) {
    return { value: null, error: `${fieldLabel} is required` };
  }
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    return { value: null, error: `${fieldLabel} must be a whole number` };
  }
  if (num < min) {
    return { value: null, error: `${fieldLabel} must be at least ${min}` };
  }
  return { value: num, error: null };
}

function parseRequiredFloat(
  value: unknown,
  fieldLabel: string,
  min = 0
): { value: number | null; error: string | null } {
  if (isEmpty(value)) {
    return { value: null, error: `${fieldLabel} is required` };
  }
  const num = Number(value);
  if (Number.isNaN(num)) {
    return { value: null, error: `${fieldLabel} must be a valid number` };
  }
  if (num < min) {
    return { value: null, error: `${fieldLabel} must be at least ${min}` };
  }
  return { value: num, error: null };
}

export function toPrismaDiscountType(value: string): PrismaDiscountType | null {
  return DISCOUNT_TYPE_MAP[value as CouponDiscountType] ?? null;
}

export function toPrismaAppliesTo(value: string): PrismaAppliesTo | null {
  return APPLIES_TO_MAP[value as CouponAppliesTo] ?? null;
}

export function toPrismaAppliesToList(values: unknown): PrismaAppliesTo[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((v) => toPrismaAppliesTo(String(v)))
    .filter((v): v is PrismaAppliesTo => v != null);
}

export function toPrismaStatus(value: string): PrismaStatus {
  return value === 'inactive' ? 'INACTIVE' : 'ACTIVE';
}

export function serializeCoupon(coupon: {
  id: string;
  code: string;
  title: string;
  automaticInstantRebate: boolean;
  discountType: PrismaDiscountType;
  discountValue: number;
  combineWithOtherCoupons: boolean;
  combineWithFinancing: boolean;
  combineWithFreeShipping: boolean;
  exclusiveCoupon: boolean;
  geographicRestrictions: string[];
  appliesTo: PrismaAppliesTo[];
  productIds: string[];
  brandIds: string[];
  productSelections: unknown;
  brandSelections: unknown;
  minQuantity: number | null;
  minOrderPrice: number | null;
  userUsageLimit: number | null;
  couponUsageLimit: number | null;
  startDate: Date;
  endDate: Date | null;
  status: PrismaStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  const productSelections = parseProductSelections(coupon.productSelections);
  const brandSelections = parseBrandSelections(coupon.brandSelections);

  const resolvedProductSelections =
    countProductSelections(productSelections) > 0
      ? productSelections
      : coupon.productIds.length > 0
        ? legacyProductSelections(coupon.productIds)
        : productSelections;

  const resolvedBrandSelections = hasBrandSelections(brandSelections)
    ? brandSelections
    : coupon.brandIds.length > 0
      ? legacyBrandSelections(coupon.brandIds)
      : brandSelections;

  return {
    ...coupon,
    discountValue: roundCurrency(coupon.discountValue),
    minOrderPrice:
      coupon.minOrderPrice != null ? roundCurrency(coupon.minOrderPrice) : null,
    discountType: REVERSE_DISCOUNT_TYPE[coupon.discountType],
    appliesTo: coupon.appliesTo.map((v) => REVERSE_APPLIES_TO[v]),
    status: REVERSE_STATUS[coupon.status],
    productSelections: resolvedProductSelections,
    brandSelections: resolvedBrandSelections,
    startDate: coupon.startDate.toISOString(),
    endDate: coupon.endDate?.toISOString() ?? null,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

export interface CouponInput {
  code?: string;
  title: string;
  automaticInstantRebate?: boolean;
  discountType: string;
  discountValue: number | string;
  combineWithOtherCoupons?: boolean;
  combineWithFinancing?: boolean;
  combineWithFreeShipping?: boolean;
  exclusiveCoupon?: boolean;
  geographicRestrictions?: string[];
  appliesTo: string[];
  productSelections?: CouponProductSelections;
  brandSelections?: CouponBrandSelections;
  productIds?: string[];
  brandIds?: string[];
  minQuantity?: number | string | null;
  minOrderPrice?: number | string | null;
  userUsageLimit?: number | string | null;
  couponUsageLimit?: number | string | null;
  startDate: string;
  endDate?: string | null;
  status?: string;
}

export function validateCouponFields(body: CouponInput): CouponFieldErrors {
  const errors: CouponFieldErrors = {};
  const automaticInstantRebate = parseBoolean(body.automaticInstantRebate);
  const discountType = body.discountType;

  if (!automaticInstantRebate) {
    if (!body.code?.trim()) {
      errors.code = 'Coupon code is required';
    } else if (!/^[A-Z0-9_-]+$/.test(body.code.trim().toUpperCase())) {
      errors.code = 'Coupon code can only contain letters, numbers, hyphens, and underscores';
    }
  }

  if (!body.title?.trim()) errors.title = 'Title is required';
  if (!toPrismaDiscountType(body.discountType)) errors.discountType = 'Invalid discount type';

  if (discountType === 'free_shipping') {
    // No discount value required for free shipping
  } else if (isEmpty(body.discountValue)) {
    errors.discountValue = 'Discount value is required';
  } else {
    const discountValue = parseCurrencyValue(body.discountValue);
    if (Number.isNaN(discountValue)) {
      errors.discountValue = 'Discount value must be a valid number';
    } else if (discountValue <= 0) {
      errors.discountValue = 'Discount value must be greater than 0';
    } else if (discountType === 'percentage' && discountValue > 100) {
      errors.discountValue = 'Percentage discount cannot exceed 100';
    }
  }

  const exclusive = parseBoolean(body.exclusiveCoupon);
  const combineWithOther = parseBoolean(body.combineWithOtherCoupons);
  const combineWithFinancing = parseBoolean(body.combineWithFinancing);
  const combineWithFreeShipping = parseBoolean(body.combineWithFreeShipping);

  if (
    exclusive &&
    (combineWithOther || combineWithFinancing || combineWithFreeShipping)
  ) {
    errors.stackingRules =
      'Exclusive coupon cannot be combined with other stacking options';
  }

  const appliesTo = toPrismaAppliesToList(body.appliesTo);
  if (appliesTo.length === 0) {
    errors.appliesTo = 'Select at least one applies to option';
  }
  if (appliesTo.includes('SPECIFIC_PRODUCTS')) {
    const productSelections = parseProductSelections(body.productSelections);
    if (countProductSelections(productSelections) === 0) {
      errors.productIds = 'Select at least one product';
    }
  }
  if (appliesTo.includes('SPECIFIC_BRANDS')) {
    const brandSelections = parseBrandSelections(body.brandSelections);
    if (!hasBrandSelections(brandSelections)) {
      errors.brandIds = 'Complete brand selection for at least one category';
    }
  }

  const minQuantity = parseRequiredInt(body.minQuantity, 'Minimum quantity', 1);
  if (minQuantity.error) errors.minQuantity = minQuantity.error;

  const minOrderPrice = parseRequiredFloat(body.minOrderPrice, 'Minimum order price', 0);
  if (minOrderPrice.error) errors.minOrderPrice = minOrderPrice.error;

  const userUsageLimit = parseRequiredInt(body.userUsageLimit, 'User usage limit', 1);
  if (userUsageLimit.error) errors.userUsageLimit = userUsageLimit.error;

  const couponUsageLimit = parseRequiredInt(body.couponUsageLimit, 'Coupon usage limit', 1);
  if (couponUsageLimit.error) errors.couponUsageLimit = couponUsageLimit.error;

  if (!body.startDate) {
    errors.startDate = 'Start date is required';
  } else {
    const start = new Date(body.startDate);
    if (Number.isNaN(start.getTime())) errors.startDate = 'Invalid start date';
  }

  if (!body.endDate) {
    errors.endDate = 'End date is required';
  } else {
    const end = new Date(body.endDate);
    if (Number.isNaN(end.getTime())) {
      errors.endDate = 'Invalid end date';
    } else if (body.startDate) {
      const start = new Date(body.startDate);
      if (!Number.isNaN(start.getTime()) && end < start) {
        errors.endDate = 'End date must be on or after start date';
      }
    }
  }

  return errors;
}

export function validateCouponInput(body: CouponInput): string | null {
  const errors = validateCouponFields(body);
  const firstError = Object.values(errors)[0];
  return firstError ?? null;
}

export function buildCouponData(body: CouponInput) {
  const appliesTo = toPrismaAppliesToList(body.appliesTo);
  const discountType = toPrismaDiscountType(body.discountType)!;
  const exclusive = parseBoolean(body.exclusiveCoupon);
  const automaticInstantRebate = parseBoolean(body.automaticInstantRebate);
  const productSelections = parseProductSelections(body.productSelections);
  const brandSelections = parseBrandSelections(body.brandSelections);
  const geographicRestrictions = Array.isArray(body.geographicRestrictions)
    ? body.geographicRestrictions.map(String)
    : [];

  let code = body.code?.trim().toUpperCase() ?? '';
  if (automaticInstantRebate && !code) {
    code = `REBATE-${Date.now().toString(36).toUpperCase()}`;
  }

  const discountValue =
    body.discountType === 'free_shipping'
      ? 0
      : parseCurrencyValue(body.discountValue);

  return {
    code,
    title: body.title.trim(),
    automaticInstantRebate,
    discountType,
    discountValue,
    combineWithOtherCoupons: exclusive ? false : parseBoolean(body.combineWithOtherCoupons),
    combineWithFinancing: exclusive ? false : parseBoolean(body.combineWithFinancing),
    combineWithFreeShipping: exclusive ? false : parseBoolean(body.combineWithFreeShipping),
    exclusiveCoupon: exclusive,
    geographicRestrictions,
    appliesTo,
    productSelections: appliesTo.includes('SPECIFIC_PRODUCTS') ? productSelections : emptyProductSelections(),
    brandSelections: appliesTo.includes('SPECIFIC_BRANDS') ? brandSelections : emptyBrandSelections(),
    productIds: appliesTo.includes('SPECIFIC_PRODUCTS') ? flattenProductSelections(productSelections) : [],
    brandIds: appliesTo.includes('SPECIFIC_BRANDS') ? flattenBrandIds(brandSelections) : [],
    minQuantity: Number(body.minQuantity),
    minOrderPrice: parseCurrencyValue(body.minOrderPrice),
    userUsageLimit: Number(body.userUsageLimit),
    couponUsageLimit: Number(body.couponUsageLimit),
    startDate: new Date(body.startDate),
    endDate: new Date(body.endDate!),
    status: toPrismaStatus(body.status ?? 'active'),
  };
}
