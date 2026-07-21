'use client';

import React from 'react';
import type { NotFoundProduct, UpdatedProduct, UpdateFilterType } from '@/lib/updateInventory';
import {
  UPDATE_FILTER_OPTIONS,
  formatMoney,
  getSkippedMeta,
} from '@/lib/updateInventory';

export function Pill({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-[13px] font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

export function StockValuePill({
  value,
  tone = 'neutral',
}: {
  value: number;
  tone?: 'neutral' | 'increase' | 'decrease';
}) {
  const toneClass =
    tone === 'increase'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'decrease'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800';
  return <Pill className={toneClass}>{value}</Pill>;
}

export function stockTone(
  prev: number,
  next: number
): 'neutral' | 'increase' | 'decrease' {
  if (next > prev) return 'increase';
  if (next < prev) return 'decrease';
  return 'neutral';
}

export function UpdateTypeFilterButtons({
  onSelect,
}: {
  onSelect: (filter: UpdateFilterType) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 mr-1">Filter by update type:</span>
      {UPDATE_FILTER_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(opt.key)}
          className={`px-3 py-1.5 rounded-full border bg-white text-sm font-medium hover:bg-gray-50 transition-colors ${opt.borderClass} ${opt.textClass}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ResultsSearchBar({
  value,
  onChange,
  onSearch,
  total,
}: {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  total: number;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex flex-1 gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSearch();
          }}
          placeholder="Search ..."
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e2a4a]/20 focus:border-[#1e2a4a]"
        />
        <button
          type="button"
          onClick={onSearch}
          className="px-4 py-2 rounded-lg bg-[#1e2a4a] text-white text-sm font-semibold hover:bg-opacity-90"
        >
          Search
        </button>
      </div>
      <div className="text-sm text-gray-600 sm:ml-auto">Total: ({total})</div>
    </div>
  );
}

export function UpdatedProductsTable({ products }: { products: UpdatedProduct[] }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-auto max-h-[520px]">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left text-gray-700 border-b border-gray-200">
              {[
                'SKU',
                'Brand',
                'Previous Cost',
                'Updated Cost',
                'Previous Price',
                'Updated Price',
                'Previous MAP',
                'Latest MAP',
                'Price Changed',
                'Previous Stock',
                'Updated Stock',
              ].map((h) => (
                <th key={h} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-3 py-10 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p, idx) => (
                <tr
                  key={`${p.id}-${idx}`}
                  className={`border-b border-gray-100 ${
                    idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'
                  }`}
                >
                  <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                    {p.sku}
                  </td>
                  <td className="px-3 py-2.5 text-gray-800 whitespace-nowrap">
                    {p.brand || '-'}
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.prevCost)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.cost)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.prevPrice)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.price)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.prevMap)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.map)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <Pill>{formatMoney(p.priceChanged)}</Pill>
                  </td>
                  <td className="px-3 py-2.5">
                    <StockValuePill value={p.prevStock} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StockValuePill
                      value={p.stock}
                      tone={stockTone(p.prevStock, p.stock)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkippedProductsTable({ products }: { products: NotFoundProduct[] }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="overflow-auto max-h-[420px]">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr className="text-left text-gray-700 border-b border-gray-200">
              <th className="px-3 py-2.5 font-semibold">SKU</th>
              <th className="px-3 py-2.5 font-semibold">Reason</th>
              <th className="px-3 py-2.5 font-semibold">Category</th>
              <th className="px-3 py-2.5 font-semibold">Suggestion</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-10 text-center text-gray-500">
                  No skipped products
                </td>
              </tr>
            ) : (
              products.map((p, idx) => {
                const meta = getSkippedMeta(p.reason);
                return (
                  <tr
                    key={`${p.sku}-${idx}`}
                    className={`border-b border-gray-100 ${
                      idx % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'
                    }`}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900 whitespace-nowrap">
                      {p.sku || 'N/A'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full border border-red-300 text-red-600 text-[12px] font-semibold bg-white">
                        {p.reason}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[12px] font-semibold">
                        {meta.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{meta.suggestion}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
