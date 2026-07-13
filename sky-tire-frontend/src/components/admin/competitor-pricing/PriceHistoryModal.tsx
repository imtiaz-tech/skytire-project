'use client';

import React, { useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { PriceUpdateHistoryRow } from '@/redux/types/competitorPricingTypes';
import { formatMoney } from '@/lib/competitorPricing';

interface PriceHistoryModalProps {
  open: boolean;
  title: string;
  rows: PriceUpdateHistoryRow[];
  loading?: boolean;
  onClose: () => void;
}

function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function toExportRows(rows: PriceUpdateHistoryRow[]) {
  return rows.map((r) => ({
    SKU: r.sku,
    Brand: r.brand,
    Model: r.model,
    'Product Name': r.productName,
    Cost: r.cost,
    'Sale Price': r.salePrice,
    'MAP Price': r.mapPrice,
    'Regular Price': r.regularPrice,
    Stock: r.stock,
    'Previous Price': r.previousPrice,
    'Updated Price': r.updatedPrice,
    Competitor: r.competitor,
    Date: formatHistoryDate(r.date),
  }));
}

export default function PriceHistoryModal({
  open,
  title,
  rows,
  loading = false,
  onClose,
}: PriceHistoryModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  if (!open) return null;

  const downloadFile = (format: 'csv' | 'xlsx') => {
    setDownloading(true);
    setShowDownloadMenu(false);
    try {
      const data = toExportRows(rows);
      const sheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, 'Price History');
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = `price-update-history-${stamp}.${format}`;
      XLSX.writeFile(workbook, filename, {
        bookType: format === 'csv' ? 'csv' : 'xlsx',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-7xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-[#1e2a4a] leading-[22px]">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto flex-1 px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-500 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading history...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-20 text-center text-gray-400 leading-[22px]">
              No latest price match updates found for the selected date range.
            </div>
          ) : (
            <table className="w-full text-sm leading-[22px] min-w-[1200px]">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-left border-b border-gray-200">
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">SKU</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Brand</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Model</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Product Name</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Cost</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Sale Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">MAP Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Regular Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Stock</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Previous Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Updated Price</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Competitor</th>
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.sku}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.brand}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.model}</td>
                    <td className="px-3 py-2.5 max-w-[280px]">{r.productName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(r.cost)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(r.salePrice)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(r.mapPrice)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(r.regularPrice)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.stock}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(r.previousPrice)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatMoney(r.updatedPrice)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.competitor || '-'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{formatHistoryDate(r.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-3">
          <div className="relative">
            <button
              type="button"
              disabled={rows.length === 0 || downloading}
              onClick={() => setShowDownloadMenu((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download Summary
            </button>
            {showDownloadMenu && (
              <div className="absolute bottom-full right-0 mb-1 flex flex-col bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[150px] z-10">
                <button
                  type="button"
                  onClick={() => downloadFile('csv')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                >
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadFile('xlsx')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-gray-50 border-t border-gray-100"
                >
                  Download Excel
                </button>
              </div>
            )}
          </div>
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
