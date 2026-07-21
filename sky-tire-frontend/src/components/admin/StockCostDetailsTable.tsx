'use client';

import React from 'react';
import {
  formatCostDisplay,
  formatMoneyOrNA,
  latestCost,
  type SourceInventoryRow,
} from '@/lib/sourceInventory';

interface StockCostDetailsTableProps {
  rows: SourceInventoryRow[] | null | undefined;
  className?: string;
  title?: string;
  /** Edit-form style: show N/A for zero stock. Preview style: show 0. */
  stockZeroAsNA?: boolean;
  /** Preview style: format cost as $97.00 */
  moneyCost?: boolean;
  showHeaderBg?: boolean;
}

export default function StockCostDetailsTable({
  rows,
  className = '',
  title = 'Stock & Cost Details',
  stockZeroAsNA = true,
  moneyCost = false,
  showHeaderBg = false,
}: StockCostDetailsTableProps) {
  const list = rows || [];

  if (list.length === 0) return null;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      {title ? (
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-[16px] font-bold text-gray-800">{title}</h3>
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-[16px]">
          <thead>
            <tr
              className={`border-b border-gray-100 text-left text-gray-800 ${
                showHeaderBg ? 'bg-gray-50' : ''
              }`}
            >
              <th className="px-5 py-3 font-bold text-[16px]">
                {moneyCost ? 'Source' : 'Source Name'}
              </th>
              <th className="px-5 py-3 font-bold text-[16px] text-right">Stock</th>
              <th className="px-5 py-3 font-bold text-[16px] text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {list.map((row) => {
              const cost = latestCost(row);
              const stockDisplay =
                stockZeroAsNA && row.stock === 0 ? 'N/A' : String(row.stock);
              const costDisplay = moneyCost
                ? formatMoneyOrNA(cost)
                : formatCostDisplay(cost);

              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-5 py-3 text-gray-800 text-[16px]">
                    {row.source?.source || 'Unknown'}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-800 text-[16px]">
                    {stockDisplay}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-800 text-[16px]">
                    {costDisplay}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
