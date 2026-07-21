'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  formatCostList,
  formatMoneyOrNA,
  getLastAndCurrentMap,
  parseCostHistory,
  type SourceInventoryRow,
} from '@/lib/sourceInventory';

interface CostDetailsModalProps {
  open: boolean;
  onClose: () => void;
  mapPrice?: number | null;
  mapPriceHistory?: unknown;
  sourceInventories?: SourceInventoryRow[] | null;
}

export default function CostDetailsModal({
  open,
  onClose,
  mapPrice,
  mapPriceHistory,
  sourceInventories,
}: CostDetailsModalProps) {
  if (!open) return null;

  const { lastMap, currentMap } = getLastAndCurrentMap(mapPrice, mapPriceHistory);
  const rows = sourceInventories || [];

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Cost Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-md bg-black text-white flex items-center justify-center hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-auto px-6 py-5 space-y-6">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">MAP Information</h3>
            <div className="flex flex-wrap gap-6 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-medium">Last MAP:</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 font-semibold">
                  {formatMoneyOrNA(lastMap)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Current MAP:</span>
                <span className="px-3 py-1 rounded-full bg-gray-100 font-semibold">
                  {formatMoneyOrNA(currentMap)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[15px] font-bold text-gray-900 mb-3">
              Cost Prices (Max 30 per source)
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-bold text-gray-800 w-48">Source</th>
                    <th className="px-4 py-3 font-bold text-gray-800">Costs</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                        No cost history available
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const history = parseCostHistory(row.costHistory);
                      return (
                        <tr key={row.id} className="border-b border-gray-100 last:border-0 align-top">
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                            {row.source?.source || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-gray-700 leading-relaxed break-words">
                            {formatCostList(history)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ViewCostDetailsButtonProps {
  mapPrice?: number | null;
  mapPriceHistory?: unknown;
  sourceInventories?: SourceInventoryRow[] | null;
}

export function ViewCostDetailsButton({
  mapPrice,
  mapPriceHistory,
  sourceInventories,
}: ViewCostDetailsButtonProps) {
  const [open, setOpen] = useState(false);
  const hasData =
    (sourceInventories && sourceInventories.length > 0) ||
    mapPrice != null ||
    (Array.isArray(mapPriceHistory) && mapPriceHistory.length > 0);

  if (!hasData) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-4 py-2 rounded-lg border border-blue-500 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
      >
        View cost details
      </button>
      <CostDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        mapPrice={mapPrice}
        mapPriceHistory={mapPriceHistory}
        sourceInventories={sourceInventories}
      />
    </>
  );
}
