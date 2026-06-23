import {
  CouponAppliesTo,
  CouponDiscountType,
  CouponStatus,
} from '@/constants/couponOptions';
import {
  CouponAppliesTo as PrismaAppliesTo,
  CouponDiscountType as PrismaDiscountType,
  CouponStatus as PrismaStatus,
} from '@prisma/client';

const DISCOUNT_TYPE_MAP: Record<CouponDiscountType, PrismaDiscountType> = {
  percentage: 'PERCENTAGE',
  fixed: 'FIXED',
};

const APPLIES_TO_MAP: Record<CouponAppliesTo, PrismaAppliesTo> = {
  all: 'ALL',
  specific_products: 'SPECIFIC_PRODUCTS',
  specific_brands: 'SPECIFIC_BRANDS',
  overall: 'OVERALL',
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
};

const REVERSE_APPLIES_TO: Record<PrismaAppliesTo, CouponAppliesTo> = {
  ALL: 'all',
  SPECIFIC_PRODUCTS: 'specific_products',
  SPECIFIC_BRANDS: 'specific_brands',
  OVERALL: 'overall',
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
  discountType: PrismaDiscountType;
  discountValue: number;
  appliesTo: PrismaAppliesTo[];
  productIds: string[];
  brandIds: string[];
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
  return {
    ...coupon,
    discountType: REVERSE_DISCOUNT_TYPE[coupon.discountType],
    appliesTo: coupon.appliesTo.map((v) => REVERSE_APPLIES_TO[v]),
    status: REVERSE_STATUS[coupon.status],
    startDate: coupon.startDate.toISOString(),
    endDate: coupon.endDate?.toISOString() ?? null,
    createdAt: coupon.createdAt.toISOString(),
    updatedAt: coupon.updatedAt.toISOString(),
  };
}

export interface CouponInput {
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  appliesTo: string[];
  productIds?: string[];
  brandIds?: string[];
  minQuantity?: number | null;
  minOrderPrice?: number | null;
  userUsageLimit?: number | null;
  couponUsageLimit?: number | null;
  startDate: string;
  endDate?: string | null;
  status?: string;
}

export function validateCouponInput(body: CouponInput): string | null {
  if (!body.code?.trim()) return 'Coupon code is required';
  if (!body.title?.trim()) return 'Title is required';
  if (!toPrismaDiscountType(body.discountType)) return 'Invalid discount type';
  if (body.discountValue == null || Number.isNaN(Number(body.discountValue))) {
    return 'Discount value is required';
  }
  if (Number(body.discountValue) <= 0) return 'Discount value must be greater than 0';
  if (body.discountType === 'percentage' && Number(body.discountValue) > 100) {
    return 'Percentage discount cannot exceed 100';
  }

  const appliesTo = toPrismaAppliesToList(body.appliesTo);
  if (appliesTo.length === 0) return 'Select at least one applies to option';
  if (
    appliesTo.includes('SPECIFIC_PRODUCTS') &&
    (!body.productIds || body.productIds.length === 0)
  ) {
    return 'Select at least one product';
  }
  if (appliesTo.includes('SPECIFIC_BRANDS') && (!body.brandIds || body.brandIds.length === 0)) {
    return 'Select at least one brand';
  }

  if (!body.startDate) return 'Start date is required';
  const start = new Date(body.startDate);
  if (Number.isNaN(start.getTime())) return 'Invalid start date';
  if (body.endDate) {
    const end = new Date(body.endDate);
    if (Number.isNaN(end.getTime())) return 'Invalid end date';
    if (end < start) return 'End date must be after start date';
  }
  return null;
}

export function buildCouponData(body: CouponInput) {
  const appliesTo = toPrismaAppliesToList(body.appliesTo);
  const discountType = toPrismaDiscountType(body.discountType)!;

  return {
    code: body.code.trim().toUpperCase(),
    title: body.title.trim(),
    discountType,
    discountValue: Number(body.discountValue),
    appliesTo,
    productIds: appliesTo.includes('SPECIFIC_PRODUCTS') ? body.productIds ?? [] : [],
    brandIds: appliesTo.includes('SPECIFIC_BRANDS') ? body.brandIds ?? [] : [],
    minQuantity: body.minQuantity != null ? Number(body.minQuantity) : null,
    minOrderPrice: body.minOrderPrice != null ? Number(body.minOrderPrice) : null,
    userUsageLimit: body.userUsageLimit != null ? Number(body.userUsageLimit) : null,
    couponUsageLimit: body.couponUsageLimit != null ? Number(body.couponUsageLimit) : null,
    startDate: new Date(body.startDate),
    endDate: body.endDate ? new Date(body.endDate) : null,
    status: toPrismaStatus(body.status ?? 'active'),
  };
}
