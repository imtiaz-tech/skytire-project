import {
  CouponAppliesTo,
  CouponDiscountType,
  CouponStatus,
  StackingRuleKey,
} from '@/constants/couponOptions';
import {
  CouponBrandSelections,
  CouponProductSelections,
} from '@/types/couponSelections';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: number;
  combineWithOtherCoupons: boolean;
  combineWithFinancing: boolean;
  combineWithFreeShipping: boolean;
  exclusiveCoupon: boolean;
  appliesTo: CouponAppliesTo[];
  productIds: string[];
  brandIds: string[];
  productSelections: CouponProductSelections;
  brandSelections: CouponBrandSelections;
  minQuantity: number | null;
  minOrderPrice: number | null;
  userUsageLimit: number | null;
  couponUsageLimit: number | null;
  startDate: string;
  endDate: string | null;
  status: CouponStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CouponsState {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}

export type { StackingRuleKey };
