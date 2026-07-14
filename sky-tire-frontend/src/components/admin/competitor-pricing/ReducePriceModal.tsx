'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type ReduceUnit = 'dollars' | 'cents';

interface ReducePriceModalProps {
  open: boolean;
  title: string;
  selectedCount: number;
  onClose: () => void;
  onApply: (amount: number, unit: ReduceUnit) => void;
}

export default function ReducePriceModal({
  open,
  title,
  selectedCount,
  onClose,
  onApply,
}: ReducePriceModalProps) {
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState<ReduceUnit>('dollars');

  useEffect(() => {
    if (open) {
      setAmount('');
      setUnit('dollars');
    }
  }, [open]);

  if (!open) return null;

  const handleApply = () => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value < 0) {
      return;
    }
    onApply(value, unit);
  };

  const parsed = parseFloat(amount);
  const canApply = Number.isFinite(parsed) && parsed >= 0 && selectedCount > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-[#1e2a4a] leading-[22px]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          <p className="text-sm text-gray-500 leading-[22px]">
            Reduce suggested price for{' '}
            <span className="font-semibold text-gray-800">{selectedCount}</span> selected
            product{selectedCount === 1 ? '' : 's'}.
          </p>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                autoFocus
              />
            </div>
            <div className="w-[140px]">
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as ReduceUnit)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white"
              >
                <option value="dollars">Dollars ($)</option>
                <option value="cents">Cents (¢)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-orange-400 text-orange-500 hover:bg-orange-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#00a65a] text-white hover:bg-[#008d4c] disabled:opacity-50"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
