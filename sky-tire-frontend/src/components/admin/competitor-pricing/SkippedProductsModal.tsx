'use client';

import React from 'react';
import { SkippedProduct } from '@/redux/types/competitorPricingTypes';
import { formatMoney } from '@/lib/competitorPricing';

interface SkippedProductsModalProps {
  open: boolean;
  products: SkippedProduct[];
  onClose: () => void;
}

function formatPlainNumber(value: number | undefined | null): string {
  if (value == null || Number.isNaN(Number(value))) return '-';
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

export default function SkippedProductsModal({
  open,
  products,
  onClose,
}: SkippedProductsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-6xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-blue-600 leading-[22px]">
            Skipped Products
          </h3>
        </div>

        <div className="overflow-auto flex-1 px-4 py-3">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm leading-[22px] min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-left border-b border-gray-200">
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">SKU</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Brand</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Model</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Name</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Sale Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">MAP Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Competitor</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Attempted Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Reason</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => {
                  const attempted =
                    p.attemptedSalePrice != null
                      ? p.attemptedSalePrice
                      : p.attemptedRegularPrice;

                  return (
                    <tr
                      key={`${p.sku}-${idx}`}
                      className="border-b border-gray-100 bg-white"
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                        {p.sku || '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                        {p.brand || '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                        {p.model || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-800 max-w-[320px]">
                        {p.productName || '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                        {p.currentSalePrice != null
                          ? formatMoney(p.currentSalePrice)
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                        {formatPlainNumber(p.mapPrice)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800 lowercase">
                        {(p.competitor || '-').toLowerCase()}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-gray-800">
                        {formatPlainNumber(attempted)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-bold text-red-600">
                        {p.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#00a65a] text-white hover:bg-[#008d4c]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
