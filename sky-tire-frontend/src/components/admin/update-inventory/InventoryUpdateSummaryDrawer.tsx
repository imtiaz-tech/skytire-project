'use client';

import React, { useMemo, useState } from 'react';
import { X, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { InventorySummary, NotFoundProduct, UpdatedProduct } from '@/lib/updateInventory';
import { formatMoney, inventoryTypeLabel } from '@/lib/updateInventory';

type TabKey = 'updated' | 'skipped';

interface Props {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  summary: InventorySummary | null;
  /** Live results from the latest run (preferred over saved summary when present) */
  liveUpdated?: UpdatedProduct[];
  liveNotFound?: NotFoundProduct[];
  liveInventoryType?: string;
}

function StockBadge({ status }: { status: UpdatedProduct['stockStatus'] }) {
  if (status === 'increase') {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-semibold">
        <ArrowUp className="h-3 w-3" /> Increase
      </span>
    );
  }
  if (status === 'decrease') {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-xs font-semibold">
        <ArrowDown className="h-3 w-3" /> Decrease
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold">
      <Minus className="h-3 w-3" /> No change
    </span>
  );
}

export default function InventoryUpdateSummaryDrawer({
  open,
  onClose,
  loading,
  summary,
  liveUpdated,
  liveNotFound,
  liveInventoryType,
}: Props) {
  const [tab, setTab] = useState<TabKey>('updated');

  const updated = liveUpdated ?? summary?.updatedProducts ?? [];
  const notFound = liveNotFound ?? summary?.notFoundProducts ?? [];
  const inventoryType = liveInventoryType ?? summary?.inventoryType ?? null;
  const timestamp = summary?.timestamp;

  const stats = useMemo(() => {
    const priceChanged = updated.filter((p) => (p.priceChanged || 0) !== 0).length;
    const stockChanged = updated.filter((p) => p.stockStatus !== 'nochange').length;
    const mapChanged = updated.filter((p) => p.mapChanged).length;
    return {
      totalUpdated: updated.length,
      totalSkipped: notFound.length,
      priceChanged,
      stockChanged,
      mapChanged,
    };
  }, [updated, notFound]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col border-l border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-[#1e2a4a]">Update Summary</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {inventoryTypeLabel(inventoryType)}
              {timestamp
                ? ` · ${new Date(timestamp).toLocaleString()}`
                : liveUpdated
                  ? ' · Latest run'
                  : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
          {loading ? (
            <div className="text-sm text-gray-500 py-12 text-center">Loading summary…</div>
          ) : !summary && !liveUpdated ? (
            <div className="text-sm text-gray-500 py-12 text-center">
              No inventory update summary found.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Updated', value: stats.totalUpdated, color: 'text-emerald-700' },
                  { label: 'Skipped', value: stats.totalSkipped, color: 'text-amber-700' },
                  { label: 'Price changed', value: stats.priceChanged, color: 'text-blue-700' },
                  { label: 'Stock changed', value: stats.stockChanged, color: 'text-indigo-700' },
                  { label: 'MAP changed', value: stats.mapChanged, color: 'text-purple-700' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                  >
                    <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                    <div className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setTab('updated')}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === 'updated'
                      ? 'border-[#1e2a4a] text-[#1e2a4a]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Updated ({updated.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab('skipped')}
                  className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === 'skipped'
                      ? 'border-[#1e2a4a] text-[#1e2a4a]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Skipped ({notFound.length})
                </button>
              </div>

              {tab === 'updated' ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-[50vh]">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead className="bg-gray-50 text-gray-600 sticky top-0">
                        <tr className="text-left border-b border-gray-200">
                          <th className="px-3 py-2.5 font-semibold">SKU</th>
                          <th className="px-3 py-2.5 font-semibold">Brand</th>
                          <th className="px-3 py-2.5 font-semibold">Cost</th>
                          <th className="px-3 py-2.5 font-semibold">Sale</th>
                          <th className="px-3 py-2.5 font-semibold">MAP</th>
                          <th className="px-3 py-2.5 font-semibold">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {updated.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                              No updated products
                            </td>
                          </tr>
                        ) : (
                          updated.map((p) => (
                            <tr key={p.id} className="border-b border-gray-100">
                              <td className="px-3 py-2.5 font-medium text-gray-800">{p.sku}</td>
                              <td className="px-3 py-2.5 text-gray-700">{p.brand || '-'}</td>
                              <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                                <span className="text-gray-400">{formatMoney(p.prevCost)}</span>
                                {' → '}
                                {formatMoney(p.cost)}
                              </td>
                              <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                                <span className="text-gray-400">{formatMoney(p.prevPrice)}</span>
                                {' → '}
                                {formatMoney(p.price)}
                              </td>
                              <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">
                                <span className="text-gray-400">{formatMoney(p.prevMap)}</span>
                                {' → '}
                                {formatMoney(p.map)}
                              </td>
                              <td className="px-3 py-2.5 text-gray-700">
                                <div className="flex flex-col gap-1">
                                  <span>
                                    {p.prevStock} → {p.stock}
                                  </span>
                                  <StockBadge status={p.stockStatus} />
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-auto max-h-[50vh]">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-600 sticky top-0">
                        <tr className="text-left border-b border-gray-200">
                          <th className="px-3 py-2.5 font-semibold">SKU</th>
                          <th className="px-3 py-2.5 font-semibold">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notFound.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="px-3 py-8 text-center text-gray-500">
                              No skipped products
                            </td>
                          </tr>
                        ) : (
                          notFound.map((p, idx) => (
                            <tr key={`${p.sku}-${idx}`} className="border-b border-gray-100">
                              <td className="px-3 py-2.5 font-medium text-gray-800">{p.sku}</td>
                              <td className="px-3 py-2.5 text-gray-700">{p.reason}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
