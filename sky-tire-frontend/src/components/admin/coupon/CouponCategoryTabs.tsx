'use client';

import React from 'react';
import { COUPON_CATEGORY_TABS, CouponCategoryKey } from '@/constants/couponCategories';

interface CouponCategoryTabsProps {
  activeTab: CouponCategoryKey;
  onChange: (tab: CouponCategoryKey) => void;
}

export default function CouponCategoryTabs({ activeTab, onChange }: CouponCategoryTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
      {COUPON_CATEGORY_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === tab.key
              ? 'bg-[#1e2a4a] text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#1e2a4a]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
