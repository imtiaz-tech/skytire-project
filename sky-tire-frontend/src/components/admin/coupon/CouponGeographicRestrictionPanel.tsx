'use client';

import React, { useMemo, useState } from 'react';
import {
  ALL_STATE_ABBREVIATIONS,
  filterStates,
  US_STATE_OPTIONS,
} from '@/constants/usStates';

interface CouponGeographicRestrictionPanelProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
  onClearError?: () => void;
}

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all';

export default function CouponGeographicRestrictionPanel({
  selected,
  onChange,
  error,
  onClearError,
}: CouponGeographicRestrictionPanelProps) {
  const [search, setSearch] = useState('');

  const filteredStates = useMemo(() => filterStates(search), [search]);
  const allSelected =
    filteredStates.length > 0 && filteredStates.every((s) => selected.includes(s.abbr));
  const someSelected =
    filteredStates.some((s) => selected.includes(s.abbr)) && !allSelected;

  const toggleState = (abbr: string) => {
    onClearError?.();
    const next = selected.includes(abbr)
      ? selected.filter((v) => v !== abbr)
      : [...selected, abbr];
    onChange(next);
  };

  const toggleSelectAllVisible = () => {
    onClearError?.();
    const visibleAbbrs = filteredStates.map((s) => s.abbr);
    if (allSelected) {
      onChange(selected.filter((abbr) => !visibleAbbrs.includes(abbr)));
    } else {
      onChange(Array.from(new Set([...selected, ...visibleAbbrs])));
    }
  };

  const toggleSelectAllStates = () => {
    onClearError?.();
    const allChosen = ALL_STATE_ABBREVIATIONS.every((abbr) => selected.includes(abbr));
    onChange(allChosen ? [] : [...ALL_STATE_ABBREVIATIONS]);
  };

  return (
    <div
      className={`border rounded-xl p-4 space-y-3 bg-white${
        error ? ' border-red-400' : ' border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-500">Geographic Restriction</label>
        {selected.length > 0 && (
          <span className="text-xs text-gray-400">{selected.length} state(s) selected</span>
        )}
      </div>
      <p className="text-xs text-gray-400">
        Leave empty to apply in all states. Search by state name or abbreviation (e.g. CA).
      </p>

      <input
        type="text"
        placeholder="Search states (e.g. CA, California)..."
        className={inputClass}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="border border-gray-100 rounded-lg overflow-hidden">
        <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100/80">
          <input
            type="checkbox"
            checked={ALL_STATE_ABBREVIATIONS.every((abbr) => selected.includes(abbr))}
            ref={(el) => {
              if (el) {
                const count = selected.length;
                el.indeterminate =
                  count > 0 && count < ALL_STATE_ABBREVIATIONS.length;
              }
            }}
            onChange={toggleSelectAllStates}
            className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a]"
          />
          <span className="text-sm font-semibold text-[#1e2a4a]">Select All States</span>
        </label>

        {filteredStates.length > 0 && filteredStates.length < US_STATE_OPTIONS.length && (
          <label className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleSelectAllVisible}
              className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a]"
            />
            <span className="text-sm font-medium text-[#1e2a4a]">Select All Visible</span>
          </label>
        )}

        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
          {filteredStates.length === 0 ? (
            <p className="text-sm text-gray-400 p-2">No states found</p>
          ) : (
            filteredStates.map((state) => (
              <label
                key={state.abbr}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(state.abbr)}
                  onChange={() => toggleState(state.abbr)}
                  className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a]"
                />
                <span>{state.label}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
