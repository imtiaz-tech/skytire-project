'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { UpdatedProduct, UpdateFilterType } from '@/lib/updateInventory';
import { UPDATE_FILTER_OPTIONS } from '@/lib/updateInventory';
import { UpdatedProductsTable } from '@/components/admin/update-inventory/InventorySummaryShared';
import { useInventoryProductPreview } from '@/components/admin/update-inventory/InventoryProductPreview';

interface Props {
  open: boolean;
  filter: UpdateFilterType | null;
  products: UpdatedProduct[];
  inventoryType?: string | null;
  onClose: () => void;
}

export default function InventoryChangeFilterModal({
  open,
  filter,
  products,
  inventoryType,
  onClose,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const { openPreview, previewModals } = useInventoryProductPreview(inventoryType);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !filter || !mounted) return null;

  const option = UPDATE_FILTER_OPTIONS.find((o) => o.key === filter);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[310] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-10 bg-white w-full max-w-6xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 my-auto">
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {option?.modalTitle || 'Filtered Products'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {products.length} product(s) found
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
            <div className="p-4 overflow-auto">
              <UpdatedProductsTable
                products={products}
                onRowClick={(p) => openPreview(p.id)}
              />
            </div>
          </div>
        </div>
      </div>
      {previewModals}
    </>,
    document.body
  );
}
