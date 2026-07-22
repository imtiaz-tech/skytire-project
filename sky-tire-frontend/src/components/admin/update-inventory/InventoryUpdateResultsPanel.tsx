'use client';

import React, { useMemo, useState } from 'react';
import type { NotFoundProduct, UpdatedProduct, UpdateFilterType } from '@/lib/updateInventory';
import {
  filterUpdatedProducts,
  inventoryTypeLabel,
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

interface Props {
  updatedProducts: UpdatedProduct[];
  notFoundProducts: NotFoundProduct[];
  inventoryType: string;
}

export default function InventoryUpdateResultsPanel({
  updatedProducts,
  notFoundProducts,
  inventoryType,
}: Props) {
  const [updatedQuery, setUpdatedQuery] = useState('');
  const [updatedSearch, setUpdatedSearch] = useState('');
  const [skippedQuery, setSkippedQuery] = useState('');
  const [skippedSearch, setSkippedSearch] = useState('');
  const [filterModal, setFilterModal] = useState<UpdateFilterType | null>(null);
  const { openPreview, previewModals } = useInventoryProductPreview(inventoryType);

  const filteredUpdated = useMemo(
    () => searchUpdatedProducts(updatedProducts, updatedSearch),
    [updatedProducts, updatedSearch]
  );
  const filteredSkipped = useMemo(
    () => searchNotFoundProducts(notFoundProducts, skippedSearch),
    [notFoundProducts, skippedSearch]
  );
  const modalProducts = useMemo(
    () => filterUpdatedProducts(updatedProducts, filterModal),
    [updatedProducts, filterModal]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-[#1e2a4a]">
          Inventory Update Results
          <span className="ml-2 text-sm font-medium text-gray-500">
            ({inventoryTypeLabel(inventoryType)})
          </span>
        </h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
        <UpdateTypeFilterButtons onSelect={setFilterModal} />
        <ResultsSearchBar
          value={updatedQuery}
          onChange={setUpdatedQuery}
          onSearch={() => setUpdatedSearch(updatedQuery)}
          total={filteredUpdated.length}
        />
        <UpdatedProductsTable
          products={filteredUpdated}
          onRowClick={(p) => openPreview(p.id)}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5 space-y-4">
        <h3 className="text-base font-bold text-[#1e2a4a]">
          Skipped Products ({notFoundProducts.length})
        </h3>
        <ResultsSearchBar
          value={skippedQuery}
          onChange={setSkippedQuery}
          onSearch={() => setSkippedSearch(skippedQuery)}
          total={filteredSkipped.length}
        />
        <SkippedProductsTable products={filteredSkipped} />
      </div>

      <InventoryChangeFilterModal
        open={Boolean(filterModal)}
        filter={filterModal}
        products={modalProducts}
        inventoryType={inventoryType}
        onClose={() => setFilterModal(null)}
      />

      {previewModals}
    </div>
  );
}
