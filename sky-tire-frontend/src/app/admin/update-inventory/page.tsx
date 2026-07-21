'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Loader2,
  History,
  Package,
  Eye,
  EyeOff,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAllInventorySources } from '@/redux/slices/inventorySourcesSlice';
import InventoryUpdateSummaryDrawer from '@/components/admin/update-inventory/InventoryUpdateSummaryDrawer';
import InventoryUpdateResultsPanel from '@/components/admin/update-inventory/InventoryUpdateResultsPanel';
import {
  CheckedStates,
  INVENTORY_TYPE_OPTIONS,
  InventorySummary,
  NotFoundProduct,
  SelectedFieldsState,
  UpdatedProduct,
  isUpdateButtonDisabled,
  parseInventoryFile,
} from '@/lib/updateInventory';

const INITIAL_FIELDS: SelectedFieldsState = {
  SKU: '',
  Brand: '',
  Cost: '',
  IncreaseCost: true,
  DecreaseCost: true,
  MAP: '',
  Stock: '',
  SalePrice: '',
  RegularPrice: '',
  inventoryType: '',
  source: '',
};

const INITIAL_CHECKED: CheckedStates = {
  Brand: false,
  Cost: false,
  Stock: false,
  MAP: false,
  SalePrice: false,
  RegularPrice: false,
  IncreaseCost: true,
  DecreaseCost: true,
};

export default function UpdateInventoryPage() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sources } = useAppSelector((state) => state.inventorySources);

  const [file, setFile] = useState<File | null>(null);
  const [columnNames, setColumnNames] = useState<string[]>([]);
  const [sampleRow, setSampleRow] = useState<unknown[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const [selectedFields, setSelectedFields] = useState<SelectedFieldsState>(INITIAL_FIELDS);
  const [checkedStates, setCheckedStates] = useState<CheckedStates>(INITIAL_CHECKED);

  const [isNewSource, setIsNewSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');

  const [updating, setUpdating] = useState(false);
  const [updatedProducts, setUpdatedProducts] = useState<UpdatedProduct[]>([]);
  const [notFoundProducts, setNotFoundProducts] = useState<NotFoundProduct[]>([]);
  const [lastInventoryType, setLastInventoryType] = useState<string>('');
  const [hasResult, setHasResult] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [savedSummary, setSavedSummary] = useState<InventorySummary | null>(null);

  useEffect(() => {
    dispatch(fetchAllInventorySources());
  }, [dispatch]);

  const buttonDisabled = useMemo(
    () => isUpdateButtonDisabled(checkedStates, selectedFields) || !file || updating,
    [checkedStates, selectedFields, file, updating]
  );

  const costMappedAndActive = !!selectedFields.Cost && !checkedStates.Cost;
  const salePriceActive =
    costMappedAndActive && !!selectedFields.SalePrice && !checkedStates.SalePrice;
  const showIncDec = costMappedAndActive && !salePriceActive;

  const mappingFields = costMappedAndActive
    ? (['SKU', 'Brand', 'Cost', 'SalePrice', 'RegularPrice', 'MAP', 'Stock'] as const)
    : (['SKU', 'Brand', 'Cost', 'MAP', 'Stock'] as const);

  const fieldLabels: Record<string, string> = {
    SKU: 'SKU',
    Brand: 'Brand',
    Cost: 'Cost',
    MAP: 'MAP',
    Stock: 'Stock',
    SalePrice: 'Sale Price',
    RegularPrice: 'Regular Price',
  };

  const getSample = (column: string) => {
    if (!column) return 'N/A';
    const idx = columnNames.indexOf(column);
    if (idx < 0) return 'N/A';
    const val = sampleRow[idx];
    return val === undefined || val === null || val === '' ? 'N/A' : String(val);
  };

  const handleFile = async (f: File | null) => {
    if (!f) return;
    const name = f.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast.error('Please upload a CSV or XLSX file');
      return;
    }
    try {
      const parsed = await parseInventoryFile(f);
      setFile(f);
      setColumnNames(parsed.columnNames);
      setSampleRow(parsed.sampleRow);
      setPreviewRows(parsed.previewRows);
      setShowPreview(true);
      setSelectedFields((prev) => ({
        ...INITIAL_FIELDS,
        inventoryType: prev.inventoryType,
        source: prev.source,
      }));
      setCheckedStates(INITIAL_CHECKED);
      setHasResult(false);
      setUpdatedProducts([]);
      setNotFoundProducts([]);
      toast.success('File loaded');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file';
      toast.error(msg);
    }
  };

  const onFieldChange = (fieldName: keyof SelectedFieldsState, value: string) => {
    if (fieldName === 'source' && value === '__new__') {
      setIsNewSource(true);
      setSelectedFields((prev) => ({ ...prev, source: '' }));
      return;
    }
    if (fieldName === 'source') {
      setIsNewSource(false);
    }
    setSelectedFields((prev) => ({ ...prev, [fieldName]: value }));
    if ((fieldName === 'SalePrice' || fieldName === 'RegularPrice') && value) {
      setCheckedStates((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const onSkipToggle = (field: keyof CheckedStates) => {
    setCheckedStates((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      if (field === 'Cost' && next.Cost) {
        next.SalePrice = true;
        next.RegularPrice = true;
      }
      return next;
    });
  };

  const loadSummary = async () => {
    setSummaryOpen(true);
    setSummaryLoading(true);
    try {
      const res = await axios.get('/api/admin/update-inventory/summary');
      const summary = res.data?.summary as InventorySummary | null;
      if (summary) {
        setSavedSummary({
          ...summary,
          updatedProducts: Array.isArray(summary.updatedProducts)
            ? summary.updatedProducts
            : [],
          notFoundProducts: Array.isArray(summary.notFoundProducts)
            ? summary.notFoundProducts
            : [],
        });
      } else {
        setSavedSummary(null);
      }
    } catch {
      toast.error('Failed to load summary');
      setSavedSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    const filtered: Record<string, unknown> = { ...selectedFields };

    if (checkedStates.Brand) delete filtered.Brand;
    if (checkedStates.Cost) {
      delete filtered.Cost;
      delete filtered.IncreaseCost;
      delete filtered.DecreaseCost;
      delete filtered.SalePrice;
      delete filtered.RegularPrice;
    }
    if (checkedStates.MAP) delete filtered.MAP;
    if (checkedStates.Stock) delete filtered.Stock;
    if (checkedStates.SalePrice) delete filtered.SalePrice;
    if (checkedStates.RegularPrice) delete filtered.RegularPrice;

    const salePriceActiveSubmit =
      !checkedStates.SalePrice && !!selectedFields.SalePrice && !checkedStates.Cost;

    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'selectedFields',
      JSON.stringify({
        ...filtered,
        inventoryType: selectedFields.inventoryType,
        source: selectedFields.source,
        IncreaseCost: salePriceActiveSubmit ? false : checkedStates.IncreaseCost,
        DecreaseCost: salePriceActiveSubmit ? false : checkedStates.DecreaseCost,
      })
    );

    setUpdating(true);
    try {
      const res = await axios.post('/api/admin/update-inventory', formData);
      const updated = (res.data?.updatedProducts || []) as UpdatedProduct[];
      const notFound = (res.data?.notFoundProducts || []) as NotFoundProduct[];
      setUpdatedProducts(updated);
      setNotFoundProducts(notFound);
      setLastInventoryType(selectedFields.inventoryType);
      setHasResult(true);
      toast.success(
        `Inventory updated: ${updated.length} updated, ${notFound.length} skipped`
      );
      setSummaryOpen(false);
      setSavedSummary(null);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } }; message?: string };
      toast.error(ax.response?.data?.error || ax.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const selectClass =
    'w-full max-w-md border border-gray-200 rounded-xl px-3 py-2.5 text-[16px] bg-white focus:outline-none focus:ring-2 focus:ring-[#1e2a4a]/20 focus:border-[#1e2a4a] disabled:bg-gray-50 disabled:text-gray-400';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Package className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Update Inventory</h1>
        </div>
        <button
          type="button"
          onClick={loadSummary}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-500 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors"
        >
          <History className="h-4 w-4" />
          View Summary
        </button>
      </div>

      {/* Upload */}
      <div
        className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center cursor-pointer hover:border-[#1e2a4a]/40 transition-colors"
        onClick={() => !updating && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (updating) return;
          const f = e.dataTransfer.files?.[0];
          if (f) void handleFile(f);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          disabled={updating}
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            void handleFile(f);
            e.target.value = '';
          }}
        />
        <Upload className="h-10 w-10 text-[#1e2a4a] mx-auto mb-3" />
        <p className="text-base font-semibold text-[#1e2a4a]">Upload CSV or XLSX</p>
        {file && (
          <p className="text-sm text-gray-500 mt-2">
            Selected: <span className="font-medium text-gray-700">{file.name}</span>
          </p>
        )}
      </div>

      {/* Preview */}
      {showPreview && previewRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1e2a4a] text-white">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="h-4 w-4" />
              File Preview (first {previewRows.length} rows)
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-xs font-medium inline-flex items-center gap-1 opacity-90 hover:opacity-100"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Hide
            </button>
          </div>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-xs min-w-[600px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {columnNames.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap border-b"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {columnNames.map((col) => (
                      <td key={col} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mapping form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-[16px] font-semibold text-gray-700 mb-2">
            Inventory Type
          </label>
          <select
            className={selectClass + ' max-w-none'}
            value={selectedFields.inventoryType}
            disabled={!file || updating}
            onChange={(e) => onFieldChange('inventoryType', e.target.value)}
          >
            <option value="">Inventory Type</option>
            {INVENTORY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="w-full sm:w-44 pt-2.5 text-[16px] font-medium text-gray-700 shrink-0">
            Source
          </div>
          <div className="flex-1 space-y-2">
            <select
              className={selectClass}
              value={isNewSource ? '__new__' : selectedFields.source}
              disabled={!file || updating}
              onChange={(e) => onFieldChange('source', e.target.value)}
            >
              <option value="">Source</option>
              {(sources || []).map((s) => (
                <option key={s.id} value={s.source}>
                  {s.source}
                </option>
              ))}
              <option value="__new__">+ New</option>
            </select>
            {isNewSource && (
              <input
                type="text"
                className={selectClass}
                placeholder="Enter new source name"
                value={newSourceName}
                disabled={updating}
                onChange={(e) => setNewSourceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSourceName.trim()) {
                    setSelectedFields((prev) => ({
                      ...prev,
                      source: newSourceName.trim(),
                    }));
                    setIsNewSource(false);
                    setNewSourceName('');
                  }
                }}
                onBlur={() => {
                  if (newSourceName.trim()) {
                    setSelectedFields((prev) => ({
                      ...prev,
                      source: newSourceName.trim(),
                    }));
                    setIsNewSource(false);
                    setNewSourceName('');
                  }
                }}
              />
            )}
            {selectedFields.source && !isNewSource && (
              <p className="text-xs text-gray-500">Using: {selectedFields.source}</p>
            )}
          </div>
        </div>

        {mappingFields.map((fieldName) => {
          const isSku = fieldName === 'SKU';
          const skippable = !isSku;
          const skipped =
            skippable && checkedStates[fieldName as keyof CheckedStates];

          return (
            <div key={fieldName} className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="w-full sm:w-44 pt-2.5 text-[16px] font-medium text-gray-700 shrink-0">
                  {fieldLabels[fieldName]}
                </div>
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <select
                      className={selectClass}
                      value={selectedFields[fieldName] as string}
                      disabled={!file || updating || Boolean(skipped)}
                      onChange={(e) =>
                        onFieldChange(fieldName as keyof SelectedFieldsState, e.target.value)
                      }
                    >
                      <option value="">Select column</option>
                      {columnNames.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      Sample: {getSample(selectedFields[fieldName] as string)}
                    </p>
                  </div>
                  {skippable && (
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600 shrink-0 sm:w-28">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={Boolean(checkedStates[fieldName as keyof CheckedStates])}
                        disabled={!file || updating || (fieldName !== 'Cost' && checkedStates.Cost && (fieldName === 'SalePrice' || fieldName === 'RegularPrice'))}
                        onChange={() => onSkipToggle(fieldName as keyof CheckedStates)}
                      />
                      Skip
                    </label>
                  )}
                  {isSku && <div className="sm:w-28" />}
                </div>
              </div>

              {fieldName === 'Cost' && showIncDec && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="hidden sm:block sm:w-44 shrink-0" />
                  <div className="flex-1 flex flex-col sm:flex-row gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Increase</p>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="IncreaseCost"
                          checked={checkedStates.IncreaseCost}
                          disabled={checkedStates.Cost || updating}
                          onChange={() =>
                            setCheckedStates((p) => ({ ...p, IncreaseCost: true }))
                          }
                        />
                        Yes
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="IncreaseCost"
                          checked={!checkedStates.IncreaseCost}
                          disabled={checkedStates.Cost || updating}
                          onChange={() =>
                            setCheckedStates((p) => ({ ...p, IncreaseCost: false }))
                          }
                        />
                        No
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Decrease</p>
                    <div className="flex items-center gap-4 text-sm">
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="DecreaseCost"
                          checked={checkedStates.DecreaseCost}
                          disabled={checkedStates.Cost || updating}
                          onChange={() =>
                            setCheckedStates((p) => ({ ...p, DecreaseCost: true }))
                          }
                        />
                        Yes
                      </label>
                      <label className="inline-flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="DecreaseCost"
                          checked={!checkedStates.DecreaseCost}
                          disabled={checkedStates.Cost || updating}
                          onChange={() =>
                            setCheckedStates((p) => ({ ...p, DecreaseCost: false }))
                          }
                        />
                        No
                      </label>
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={buttonDisabled}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center gap-2 bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
          >
            {updating && <Loader2 className="h-4 w-4 animate-spin" />}
            {updating ? 'Updating...' : 'Update Inventory'}
          </button>
        </div>
      </div>

      {/* Results on page (not modal) */}
      {hasResult && (
        <InventoryUpdateResultsPanel
          updatedProducts={updatedProducts}
          notFoundProducts={notFoundProducts}
          inventoryType={lastInventoryType}
        />
      )}

      <InventoryUpdateSummaryDrawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        loading={summaryLoading}
        summary={savedSummary}
        liveUpdated={
          savedSummary
            ? undefined
            : hasResult
              ? updatedProducts
              : undefined
        }
        liveNotFound={
          savedSummary
            ? undefined
            : hasResult
              ? notFoundProducts
              : undefined
        }
        liveInventoryType={
          savedSummary
            ? undefined
            : hasResult
              ? lastInventoryType
              : undefined
        }
      />
    </div>
  );
}
