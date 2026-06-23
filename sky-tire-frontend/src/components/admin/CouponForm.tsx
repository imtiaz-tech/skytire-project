'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createCoupon, updateCoupon } from '@/features/coupons/slice';
import { Coupon } from '@/redux/types/couponTypes';
import {
  APPLIES_TO_GROUPS,
  ALL_APPLIES_TO_VALUES,
  CouponAppliesTo,
  DISCOUNT_TYPE_OPTIONS,
  generateCouponCode,
} from '@/constants/couponOptions';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface CouponFormProps {
  editCoupon?: Coupon;
}

interface LookupProduct {
  id: string;
  label: string;
  type: string;
}

interface LookupBrand {
  id: string;
  brandName: string;
  category: string;
}

const defaultForm = {
  code: generateCouponCode(),
  title: '',
  discountType: 'percentage' as const,
  discountValue: '',
  appliesTo: [] as CouponAppliesTo[],
  productIds: [] as string[],
  brandIds: [] as string[],
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
  const [products, setProducts] = useState<LookupProduct[]>([]);
  const [brands, setBrands] = useState<LookupBrand[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => {
    if (editCoupon) {
      setFormData({
        code: editCoupon.code,
        title: editCoupon.title,
        discountType: editCoupon.discountType,
        discountValue: String(editCoupon.discountValue),
        appliesTo: Array.isArray(editCoupon.appliesTo)
          ? editCoupon.appliesTo
          : [editCoupon.appliesTo as CouponAppliesTo],
        productIds: editCoupon.productIds,
        brandIds: editCoupon.brandIds,
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

  useEffect(() => {
    if (formData.appliesTo.includes('specific_products')) {
      const fetchProducts = async () => {
        try {
          const res = await axios.get(
            `/api/admin/coupons/lookup?type=products&search=${encodeURIComponent(productSearch)}`
          );
          setProducts(res.data);
        } catch {
          toast.error('Failed to load products');
        }
      };
      fetchProducts();
    }
  }, [formData.appliesTo, productSearch]);

  useEffect(() => {
    if (formData.appliesTo.includes('specific_brands')) {
      const fetchBrands = async () => {
        try {
          const res = await axios.get(
            `/api/admin/coupons/lookup?type=brands&search=${encodeURIComponent(brandSearch)}`
          );
          setBrands(res.data);
        } catch {
          toast.error('Failed to load brands');
        }
      };
      fetchBrands();
    }
  }, [formData.appliesTo, brandSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.appliesTo.length === 0) {
      return toast.error('Select at least one applies to option');
    }

    setLoading(true);

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue),
      minQuantity: formData.minQuantity ? Number(formData.minQuantity) : null,
      minOrderPrice: formData.minOrderPrice ? Number(formData.minOrderPrice) : null,
      userUsageLimit: formData.userUsageLimit ? Number(formData.userUsageLimit) : null,
      couponUsageLimit: formData.couponUsageLimit ? Number(formData.couponUsageLimit) : null,
      endDate: formData.endDate || null,
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

  const toggleAppliesTo = (value: CouponAppliesTo) => {
    setFormData((prev) => {
      const next = prev.appliesTo.includes(value)
        ? prev.appliesTo.filter((v) => v !== value)
        : [...prev.appliesTo, value];
      return {
        ...prev,
        appliesTo: next,
        productIds: next.includes('specific_products') ? prev.productIds : [],
        brandIds: next.includes('specific_brands') ? prev.brandIds : [],
      };
    });
  };

  const allSelected = ALL_APPLIES_TO_VALUES.every((v) => formData.appliesTo.includes(v));
  const someSelected = formData.appliesTo.length > 0 && !allSelected;

  const toggleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      appliesTo: allSelected ? [] : [...ALL_APPLIES_TO_VALUES],
      productIds: allSelected ? [] : prev.productIds,
      brandIds: allSelected ? [] : prev.brandIds,
    }));
  };

  const toggleProduct = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((p) => p !== id)
        : [...prev.productIds, id],
    }));
  };

  const toggleBrand = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      brandIds: prev.brandIds.includes(id)
        ? prev.brandIds.filter((b) => b !== id)
        : [...prev.brandIds, id],
    }));
  };

  const inputClass =
    'w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all';
  const labelClass = 'block text-sm font-semibold text-gray-500 mb-1.5';

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
            <label className={labelClass}>Applies To</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
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
          </div>

          <div>
            <label className={labelClass}>Minimum Order Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Minimum Order Price"
              className={inputClass}
              value={formData.minOrderPrice}
              onChange={(e) => setFormData({ ...formData, minOrderPrice: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>Minimum Quantity</label>
            <input
              type="number"
              min="0"
              placeholder="Minimum Quantity"
              className={inputClass}
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>User Usage Limit</label>
            <input
              type="number"
              min="0"
              placeholder="User Usage Limit"
              className={inputClass}
              value={formData.userUsageLimit}
              onChange={(e) => setFormData({ ...formData, userUsageLimit: e.target.value })}
            />
          </div>

          <div>
            <label className={labelClass}>Coupon Usage Limit</label>
            <input
              type="number"
              min="0"
              placeholder="Coupon Usage Limit"
              className={inputClass}
              value={formData.couponUsageLimit}
              onChange={(e) => setFormData({ ...formData, couponUsageLimit: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Start Date</label>
            <input
              type="date"
              className={inputClass}
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
          </div>
          <div>
            <label className={labelClass}>End Date</label>
            <input
              type="date"
              className={inputClass}
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>
        </div>

        {formData.appliesTo.includes('specific_products') && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <label className={labelClass}>Select Products</label>
            <input
              type="text"
              placeholder="Search products..."
              className={inputClass}
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
              {products.length === 0 ? (
                <p className="text-sm text-gray-400 p-2">No products found</p>
              ) : (
                products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.productIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                    />
                    <span>{product.label}</span>
                  </label>
                ))
              )}
            </div>
            {formData.productIds.length > 0 && (
              <p className="text-xs text-gray-500">{formData.productIds.length} product(s) selected</p>
            )}
          </div>
        )}

        {formData.appliesTo.includes('specific_brands') && (
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <label className={labelClass}>Select Brands</label>
            <input
              type="text"
              placeholder="Search brands..."
              className={inputClass}
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
            />
            <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
              {brands.length === 0 ? (
                <p className="text-sm text-gray-400 p-2">No brands found</p>
              ) : (
                brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.brandIds.includes(brand.id)}
                      onChange={() => toggleBrand(brand.id)}
                    />
                    <span>
                      {brand.brandName}{' '}
                      <span className="text-gray-400 capitalize">({brand.category})</span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {formData.brandIds.length > 0 && (
              <p className="text-xs text-gray-500">{formData.brandIds.length} brand(s) selected</p>
            )}
          </div>
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
