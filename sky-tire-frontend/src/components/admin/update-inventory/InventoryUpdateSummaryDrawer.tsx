'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import type {
  InventorySummary,
  NotFoundProduct,
  UpdatedProduct,
  UpdateFilterType,
} from '@/lib/updateInventory';
import {
  computeSummaryStats,
  filterUpdatedProducts,
  formatMoney,
  formatRelativeTime,
  inventoryTypeSingular,
  searchNotFoundProducts,
  searchUpdatedProducts,
} from '@/lib/updateInventory';
import {
  ResultsSearchBar,
  SkippedProductsTable,
  UpdateTypeFilterButtons,
  UpdatedProductsTable,
} from '@/components/admin/update-inventory/InventorySummaryShared';
import InventoryChangeFilterModal from '@/components/admin/update-inventory/InventoryChangeFilterModal';
import { useInventoryProductPreview } from '@/components/admin/update-inventory/InventoryProductPreview';

type TabKey = 'updated' | 'skipped';

interface Props {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  summary: InventorySummary | null;
  liveUpdated?: UpdatedProduct[];
  liveNotFound?: NotFoundProduct[];
  liveInventoryType?: string;
  liveSourceName?: string | null;
  liveUploadColumns?: string[] | null;
}

export default function InventoryUpdateSummaryDrawer({
  open,
  onClose,
  loading,
  summary,
  liveUpdated,
  liveNotFound,
  liveInventoryType,
  liveSourceName,
  liveUploadColumns,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabKey>('updated');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [filterModal, setFilterModal] = useState<UpdateFilterType | null>(null);

  const updated = liveUpdated ?? summary?.updatedProducts ?? [];
  const notFound = liveNotFound ?? summary?.notFoundProducts ?? [];
  const inventoryType = liveInventoryType ?? summary?.inventoryType ?? null;
  const sourceName = liveSourceName ?? summary?.sourceName ?? null;
  const uploadColumns = liveUploadColumns ?? summary?.uploadColumns ?? null;
  const timestamp = summary?.timestamp;
  const { openPreview, previewModals } = useInventoryProductPreview(inventoryType);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setTab('updated');
      setQuery('');
      setSearch('');
      setFilterModal(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const stats = useMemo(
    () => computeSummaryStats(updated, notFound),
    [updated, notFound]
  );

  const visibleUpdated = useMemo(
    () => searchUpdatedProducts(updated, search),
    [updated, search]
  );
  const visibleSkipped = useMemo(
    () => searchNotFoundProducts(notFound, search),
    [notFound, search]
  );
  const modalProducts = useMemo(
    () => filterUpdatedProducts(updated, filterModal),
    [updated, filterModal]
  );

  if (!open || !mounted) return null;

  const statCards = [
    { label: 'Updated', value: String(stats.totalUpdated) },
    { label: 'Skipped', value: String(stats.totalSkipped) },
    { label: 'Success Rate', value: `${stats.successRate}%` },
    { label: 'Total Processed', value: String(stats.totalProcessed) },
    { label: 'Price Changes', value: String(stats.priceChanges) },
    { label: 'Cost Changes', value: String(stats.costChanges) },
    { label: 'Stock Changes', value: String(stats.stockChanges) },
    {
      label: 'Avg Cost Change',
      value: formatMoney(stats.avgCostChange).replace('$ ', '$'),
    },
  ];

  return createPortal(
    <>
      <div className="fixed inset-0 z-[300] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />

          <div className="relative z-10 bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[#1e2a4a]">Update Summary</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatRelativeTime(timestamp)} •{' '}
                  {inventoryTypeSingular(inventoryType)}
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
                <div className="text-sm text-gray-500 py-12 text-center">
                  Loading summary…
                </div>
              ) : !summary && !liveUpdated ? (
                <div className="text-sm text-gray-500 py-12 text-center">
                  No inventory update summary found.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {statCards.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-center"
                      >
                        <div className="text-lg font-bold text-[#1e2a4a] leading-tight">
                          {s.value}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('updated');
                        setQuery('');
                        setSearch('');
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                        tab === 'updated'
                          ? 'border-[#1e2a4a] text-[#1e2a4a]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      Updated ({updated.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('skipped');
                        setQuery('');
                        setSearch('');
                      }}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                        tab === 'skipped'
                          ? 'border-[#1e2a4a] text-[#1e2a4a]'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <XCircle className="h-4 w-4 text-gray-400" />
                      Skipped ({notFound.length})
                    </button>
                  </div>

                  {tab === 'updated' && (
                    <UpdateTypeFilterButtons onSelect={setFilterModal} />
                  )}

                  <ResultsSearchBar
                    value={query}
                    onChange={setQuery}
                    onSearch={() => setSearch(query)}
                    total={
                      tab === 'updated'
                        ? visibleUpdated.length
                        : visibleSkipped.length
                    }
                  />

                  {tab === 'updated' ? (
                    <UpdatedProductsTable
                      products={visibleUpdated}
                      onRowClick={(p) => openPreview(p.id)}
                    />
                  ) : (
                    <SkippedProductsTable
                      products={visibleSkipped}
                      inventoryType={inventoryType}
                      sourceName={sourceName}
                      uploadColumns={uploadColumns}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <InventoryChangeFilterModal
        open={Boolean(filterModal)}
        filter={filterModal}
        products={modalProducts}
        inventoryType={inventoryType}
        onClose={() => setFilterModal(null)}
      />
      {previewModals}
    </>,
    document.body
  );
}
