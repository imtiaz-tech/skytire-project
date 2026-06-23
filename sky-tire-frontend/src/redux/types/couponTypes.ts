import {
  CouponAppliesTo,
  CouponDiscountType,
  CouponStatus,
} from '@/constants/couponOptions';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: number;
  appliesTo: CouponAppliesTo[];
  productIds: string[];
  brandIds: string[];
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

export interface CouponFormData {
  code: string;
  title: string;
  discountType: CouponDiscountType;
  discountValue: string;
  appliesTo: CouponAppliesTo[];
  productIds: string[];
  brandIds: string[];
  minQuantity: string;
  minOrderPrice: string;
  userUsageLimit: string;
  couponUsageLimit: string;
  startDate: string;
  endDate: string;
  status: CouponStatus;
}
