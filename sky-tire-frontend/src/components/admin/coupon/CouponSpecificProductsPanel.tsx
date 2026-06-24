'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import CouponCategoryTabs from './CouponCategoryTabs';
import { DEFAULT_COUPON_CATEGORY, CouponCategoryKey } from '@/constants/couponCategories';
import { CouponProductSelections } from '@/types/couponSelections';

interface LookupItem {
  id: string;
  label: string;
}

interface CouponSpecificProductsPanelProps {
  selections: CouponProductSelections;
  onChange: (selections: CouponProductSelections) => void;
  error?: string;
  onClearError?: () => void;
}

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all';

export default function CouponSpecificProductsPanel({
  selections,
  onChange,
  error,
  onClearError,
}: CouponSpecificProductsPanelProps) {
  const [activeTab, setActiveTab] = useState<CouponCategoryKey>(DEFAULT_COUPON_CATEGORY);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `/api/admin/coupons/targets?step=products&category=${activeTab}&search=${encodeURIComponent(search)}`
        );
        setItems(res.data);
      } catch {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [activeTab, search]);

  const toggleItem = (id: string) => {
    onClearError?.();
    const current = selections[activeTab];
    const next = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    onChange({ ...selections, [activeTab]: next });
  };

  const selectedCount = selections[activeTab].length;
  const totalSelected = Object.values(selections).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div
      className={`border rounded-xl p-4 space-y-4 bg-white${
        error ? ' border-red-400' : ' border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-500">Select Products</label>
        {totalSelected > 0 && (
          <span className="text-xs text-gray-400">{totalSelected} total selected</span>
        )}
      </div>

      <CouponCategoryTabs
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setSearch('');
        }}
      />

      <input
        type="text"
        placeholder={`Search ${activeTab.replace(/_/g, ' ')}...`}
        className={inputClass}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="max-h-56 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2 min-h-[120px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#1e2a4a]" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400 p-2">No products found</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={selections[activeTab].includes(item.id)}
                onChange={() => toggleItem(item.id)}
                className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a]"
              />
              <span>{item.label}</span>
            </label>
          ))
        )}
      </div>

      {selectedCount > 0 && (
        <p className="text-xs text-gray-500">
          {selectedCount} product(s) selected in this tab
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
