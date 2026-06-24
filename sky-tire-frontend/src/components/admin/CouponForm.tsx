'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createCoupon, updateCoupon } from '@/features/coupons/slice';
import { validateCouponFields, CouponFieldErrors } from '@/lib/couponValidation';
import { Coupon } from '@/redux/types/couponTypes';
import {
  APPLIES_TO_GROUPS,
  ALL_APPLIES_TO_VALUES,
  CouponAppliesTo,
  DISCOUNT_TYPE_OPTIONS,
  STACKING_RULE_OPTIONS,
  StackingRuleKey,
  generateCouponCode,
} from '@/constants/couponOptions';
import CouponSpecificProductsPanel from '@/components/admin/coupon/CouponSpecificProductsPanel';
import CouponSpecificBrandsPanel from '@/components/admin/coupon/CouponSpecificBrandsPanel';
import {
  emptyBrandSelections,
  emptyProductSelections,
} from '@/types/couponSelections';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface CouponFormProps {
  editCoupon?: Coupon;
}

const defaultForm = {
  code: generateCouponCode(),
  title: '',
  discountType: 'percentage' as const,
  discountValue: '',
  combineWithOtherCoupons: false,
  combineWithFinancing: false,
  combineWithFreeShipping: false,
  exclusiveCoupon: false,
  appliesTo: [] as CouponAppliesTo[],
  productSelections: emptyProductSelections(),
  brandSelections: emptyBrandSelections(),
  minQuantity: '',
  minOrderPrice: '',
  userUsageLimit: '',
  couponUsageLimit: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  status: 'active' as const,
};

export default function CouponForm({ editCoupon }: CouponFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [fieldErrors, setFieldErrors] = useState<CouponFieldErrors>({});

  useEffect(() => {
    if (editCoupon) {
      setFormData({
        code: editCoupon.code,
        title: editCoupon.title,
        discountType: editCoupon.discountType,
        discountValue: String(editCoupon.discountValue),
        combineWithOtherCoupons: editCoupon.combineWithOtherCoupons,
        combineWithFinancing: editCoupon.combineWithFinancing,
        combineWithFreeShipping: editCoupon.combineWithFreeShipping,
        exclusiveCoupon: editCoupon.exclusiveCoupon,
        appliesTo: Array.isArray(editCoupon.appliesTo)
          ? editCoupon.appliesTo
          : [editCoupon.appliesTo as CouponAppliesTo],
        productSelections: editCoupon.productSelections,
        brandSelections: editCoupon.brandSelections,
        minQuantity: editCoupon.minQuantity != null ? String(editCoupon.minQuantity) : '',
        minOrderPrice: editCoupon.minOrderPrice != null ? String(editCoupon.minOrderPrice) : '',
        userUsageLimit:
          editCoupon.userUsageLimit != null ? String(editCoupon.userUsageLimit) : '',
        couponUsageLimit:
          editCoupon.couponUsageLimit != null ? String(editCoupon.couponUsageLimit) : '',
        startDate: editCoupon.startDate.split('T')[0],
        endDate: editCoupon.endDate ? editCoupon.endDate.split('T')[0] : '',
        status: editCoupon.status,
      });
    }
  }, [editCoupon]);

  const inputClass =
    'w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all';
  const labelClass = 'block text-sm font-semibold text-gray-500 mb-1.5';
  const errorClass = 'text-xs text-red-500 mt-1';

  const fieldInputClass = (field: keyof CouponFieldErrors) =>
    `${inputClass}${fieldErrors[field] ? ' border-red-400 focus:border-red-400 focus:ring-red-100' : ''}`;

  const clearFieldError = (field: keyof CouponFieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateCouponFields(formData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      minQuantity: Number(formData.minQuantity),
      minOrderPrice: Number(formData.minOrderPrice),
      userUsageLimit: Number(formData.userUsageLimit),
      couponUsageLimit: Number(formData.couponUsageLimit),
    };

    try {
      if (editCoupon) {
        await dispatch(updateCoupon({ id: editCoupon.id, data: payload })).unwrap();
        toast.success('Coupon updated successfully');
      } else {
        await dispatch(createCoupon(payload)).unwrap();
        toast.success('Coupon created successfully');
      }
      router.push('/admin/coupons');
      router.refresh();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to save coupon');
    } finally {
      setLoading(false);
    }
  };

  const toggleStackingRule = (key: StackingRuleKey) => {
    clearFieldError('stackingRules');
    setFormData((prev) => {
      if (key === 'exclusiveCoupon') {
        const next = !prev.exclusiveCoupon;
        return {
          ...prev,
          exclusiveCoupon: next,
          combineWithOtherCoupons: false,
          combineWithFinancing: false,
          combineWithFreeShipping: false,
        };
      }

      const next = !prev[key];
      return {
        ...prev,
        [key]: next,
        exclusiveCoupon: next ? false : prev.exclusiveCoupon,
      };
    });
  };

  const toggleAppliesTo = (value: CouponAppliesTo) => {
    clearFieldError('appliesTo');
    setFormData((prev) => {
      const next = prev.appliesTo.includes(value)
        ? prev.appliesTo.filter((v) => v !== value)
        : [...prev.appliesTo, value];
      return {
        ...prev,
        appliesTo: next,
        productSelections: next.includes('specific_products') ? prev.productSelections : emptyProductSelections(),
        brandSelections: next.includes('specific_brands') ? prev.brandSelections : emptyBrandSelections(),
      };
    });
  };

  const allSelected = ALL_APPLIES_TO_VALUES.every((v) => formData.appliesTo.includes(v));
  const someSelected = formData.appliesTo.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    clearFieldError('appliesTo');
    setFormData((prev) => ({
      ...prev,
      appliesTo: allSelected ? [] : [...ALL_APPLIES_TO_VALUES],
      productSelections: allSelected ? emptyProductSelections() : prev.productSelections,
      brandSelections: allSelected ? emptyBrandSelections() : prev.brandSelections,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="relative flex items-center justify-center mb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="absolute left-0 p-2 text-[#1e2a4a] hover:bg-gray-50 rounded-lg transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-[#1e2a4a]">
          {editCoupon ? 'Edit Coupon' : 'Add New Coupon'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Title</label>
            <input
              type="text"
              placeholder="Coupon Title"
              className={inputClass}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Coupon Code</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Coupon Code"
                className={`${inputClass} pr-12 uppercase`}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, code: generateCouponCode() })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#1e2a4a] transition-colors"
                title="Generate code"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Discount Type</label>
            <select
              className={inputClass}
              value={formData.discountType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountType: e.target.value as typeof formData.discountType,
                })
              }
            >
              {DISCOUNT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Discount Value</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Discount Value"
              className={inputClass}
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Stacking Rules</label>
            <div
              className={`border rounded-xl p-4 space-y-2 bg-white${
                fieldErrors.stackingRules ? ' border-red-400' : ' border-gray-200'
              }`}
            >
              {STACKING_RULE_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData[opt.key]}
                    onChange={() => toggleStackingRule(opt.key)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] focus:ring-[#1e2a4a]"
                  />
                  <span className="text-sm font-medium text-[#1e2a4a]">{opt.label}</span>
                </label>
              ))}
            </div>
            {fieldErrors.stackingRules && (
              <p className={errorClass}>{fieldErrors.stackingRules}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Applies To</label>
            <div
              className={`border rounded-xl overflow-hidden bg-white${
                fieldErrors.appliesTo ? ' border-red-400' : ' border-gray-200'
              }`}
            >
              <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100/80 transition-colors">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] focus:ring-[#1e2a4a]"
                />
                <span className="text-sm font-bold text-[#1e2a4a]">Select All</span>
                {formData.appliesTo.length > 0 && (
                  <span className="text-xs text-gray-400 ml-auto">
                    {formData.appliesTo.length} selected
                  </span>
                )}
              </label>

              <div className="p-4 space-y-4 max-h-72 overflow-y-auto">
                {APPLIES_TO_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.options.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.appliesTo.includes(opt.value)}
                            onChange={() => toggleAppliesTo(opt.value)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] focus:ring-[#1e2a4a]"
                          />
                          <span className="text-sm font-medium text-[#1e2a4a]">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {fieldErrors.appliesTo && <p className={errorClass}>{fieldErrors.appliesTo}</p>}
          </div>

          <div>
            <label className={labelClass}>Minimum Order Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Minimum Order Price"
              className={fieldInputClass('minOrderPrice')}
              value={formData.minOrderPrice}
              onChange={(e) => {
                clearFieldError('minOrderPrice');
                setFormData({ ...formData, minOrderPrice: e.target.value });
              }}
              required
            />
            {fieldErrors.minOrderPrice && (
              <p className={errorClass}>{fieldErrors.minOrderPrice}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Minimum Quantity</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Minimum Quantity"
              className={fieldInputClass('minQuantity')}
              value={formData.minQuantity}
              onChange={(e) => {
                clearFieldError('minQuantity');
                setFormData({ ...formData, minQuantity: e.target.value });
              }}
              required
            />
            {fieldErrors.minQuantity && <p className={errorClass}>{fieldErrors.minQuantity}</p>}
          </div>
          <div>
            <label className={labelClass}>User Usage Limit</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="User Usage Limit"
              className={fieldInputClass('userUsageLimit')}
              value={formData.userUsageLimit}
              onChange={(e) => {
                clearFieldError('userUsageLimit');
                setFormData({ ...formData, userUsageLimit: e.target.value });
              }}
              required
            />
            {fieldErrors.userUsageLimit && (
              <p className={errorClass}>{fieldErrors.userUsageLimit}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Coupon Usage Limit</label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Coupon Usage Limit"
              className={fieldInputClass('couponUsageLimit')}
              value={formData.couponUsageLimit}
              onChange={(e) => {
                clearFieldError('couponUsageLimit');
                setFormData({ ...formData, couponUsageLimit: e.target.value });
              }}
              required
            />
            {fieldErrors.couponUsageLimit && (
              <p className={errorClass}>{fieldErrors.couponUsageLimit}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={fieldInputClass('startDate')}
              value={formData.startDate}
              onChange={(e) => {
                clearFieldError('startDate');
                clearFieldError('endDate');
                setFormData({ ...formData, startDate: e.target.value });
              }}
              required
            />
            {fieldErrors.startDate && <p className={errorClass}>{fieldErrors.startDate}</p>}
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              className={fieldInputClass('endDate')}
              value={formData.endDate}
              onChange={(e) => {
                clearFieldError('endDate');
                setFormData({ ...formData, endDate: e.target.value });
              }}
              required
            />
            {fieldErrors.endDate && <p className={errorClass}>{fieldErrors.endDate}</p>}
          </div>
        </div>

        {formData.appliesTo.includes('specific_products') && (
          <CouponSpecificProductsPanel
            selections={formData.productSelections}
            onChange={(productSelections) =>
              setFormData((prev) => ({ ...prev, productSelections }))
            }
            error={fieldErrors.productIds}
            onClearError={() => clearFieldError('productIds')}
          />
        )}

        {formData.appliesTo.includes('specific_brands') && (
          <CouponSpecificBrandsPanel
            selections={formData.brandSelections}
            onChange={(brandSelections) =>
              setFormData((prev) => ({ ...prev, brandSelections }))
            }
            error={fieldErrors.brandIds}
            onClearError={() => clearFieldError('brandIds')}
          />
        )}

        <div className="flex items-center justify-between pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.status === 'active'}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })
              }
              className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] focus:ring-[#1e2a4a]"
            />
            <span className="text-sm font-semibold text-[#1e2a4a]">Active</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="px-10 py-3 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {editCoupon ? 'Update' : 'Add'}
          </button>
        </div>
      </form>
    </div>
  );
}
