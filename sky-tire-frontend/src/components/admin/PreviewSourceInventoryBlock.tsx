'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StockCostDetailsTable from '@/components/admin/StockCostDetailsTable';
import { ViewCostDetailsButton } from '@/components/admin/CostDetailsModal';
import type { SourceInventoryRow } from '@/lib/sourceInventory';

type ProductKind = 'tire' | 'wheel' | 'wireWheel' | 'boltOnWheel' | 'accessory';

const API_PATH: Record<ProductKind, string> = {
  tire: 'tires',
  wheel: 'wheels',
  wireWheel: 'wire-wheels',
  boltOnWheel: 'bolt-on-wire-wheels',
  accessory: 'accessories',
};

interface PreviewSourceInventoryBlockProps {
  productId: string;
  productKind: ProductKind;
  mapPrice?: number | null;
  mapPriceHistory?: unknown;
  /** Prefer preloaded rows from GET /[id] when available */
  sourceInventories?: SourceInventoryRow[] | null;
}

export default function PreviewSourceInventoryBlock({
  productId,
  productKind,
  mapPrice,
  mapPriceHistory,
  sourceInventories: preloaded,
}: PreviewSourceInventoryBlockProps) {
  const [rows, setRows] = useState<SourceInventoryRow[]>(preloaded || []);
  const [history, setHistory] = useState<unknown>(mapPriceHistory);
  const [currentMap, setCurrentMap] = useState<number | null | undefined>(mapPrice);

  useEffect(() => {
    if (preloaded && preloaded.length > 0) {
      setRows(preloaded);
      setHistory(mapPriceHistory);
      setCurrentMap(mapPrice);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get(`/api/admin/${API_PATH[productKind]}/${productId}`);
        if (cancelled) return;
        setRows(res.data?.sourceInventories || []);
        setHistory(res.data?.mapPriceHistory);
        setCurrentMap(res.data?.mapPrice);
      } catch {
        if (!cancelled) setRows([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId, productKind, preloaded, mapPrice, mapPriceHistory]);

  if (!rows.length) return null;

  return (
    <div className="space-y-4">
      <ViewCostDetailsButton
        mapPrice={currentMap}
        mapPriceHistory={history}
        sourceInventories={rows}
      />
      <StockCostDetailsTable
        rows={rows}
        title=""
        stockZeroAsNA={false}
        moneyCost
        showHeaderBg
      />
    </div>
  );
}
