'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Upload,
  Loader2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  applyCompetitorToSelectedRegular,
  applyCompetitorToSelectedSale,
  bulkUpdateRegularPrices,
  bulkUpdateSalePrices,
  clearSkippedProducts,
  fetchCompetitorProducts,
  fetchPriceUpdateHistory,
  selectAllMinPrices,
  selectAllRegularPrices,
  selectCompetitorRegularForProduct,
  selectCompetitorSaleForProduct,
  setCompetitorRegularPrices,
  setCompetitorSalePrices,
  clearPriceHistory,
  setRegularPrice,
  setSalePrice,
  setScrapedData,
  toggleRegularSelection,
  toggleSaleSelection,
} from '@/features/competitor-pricing/slice';
import {
  calcMargins,
  calcPriceMatchMargins,
  COMPETITOR_PRICE_BTN_ACTIVE,
  COMPETITOR_PRICE_BTN_IDLE,
  competitorPriceColumnLabel,
  competitorRegularColumnLabel,
  competitorShortName,
  formatMoney,
  formatPriceMatchMarginDollar,
  getCompetitorTheme,
  getCompetitorsForProduct,
  isInDateRange,
  parseCompetitorWorkbook,
  pickLowestCompetitor,
  priceMatchMarginColorClass,
  productMatchesSearch,
  toNumber,
} from '@/lib/competitorPricing';
import Pagination from '@/components/ui/Pagination';
import SkippedProductsModal from '@/components/admin/competitor-pricing/SkippedProductsModal';
import PriceHistoryModal from '@/components/admin/competitor-pricing/PriceHistoryModal';

type SortKey =
  | 'sku'
  | 'brand'
  | 'model'
  | 'tireSize'
  | 'cost'
  | 'salePrice'
  | 'regularPrice'
  | 'stock';

type CheckMode = null | 'sale' | 'regular';

export default function CompetitorPricingPage() {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    products,
    loading,
    updating,
    total,
    scrapedData,
    sheetNames,
    updatedPrices,
    updatedRegularPrices,
    selectedSkus,
    selectedRegularSkus,
    selectedSaleCompetitorName,
    selectedRegularCompetitorName,
    skippedProducts,
    activeSaleSourceCompetitor,
    activeRegularSourceCompetitor,
    priceHistory,
    historyLoading,
  } = useAppSelector((state) => state.competitorPricing);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [sortBy, setSortBy] = useState<SortKey>('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [uploading, setUploading] = useState(false);

  const [checkMode, setCheckMode] = useState<CheckMode>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);

  const [saleCompetitorSelect, setSaleCompetitorSelect] = useState('');
  const [regularCompetitorSelect, setRegularCompetitorSelect] = useState('');
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const hasScrapedData = sheetNames.length > 0;
  const datesReady = Boolean(startDate && endDate);

  useEffect(() => {
    dispatch(fetchCompetitorProducts());
  }, [dispatch]);

  useEffect(() => {
    if (skippedProducts.length > 0) {
      setShowSkippedModal(true);
    }
  }, [skippedProducts]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => productMatchesSearch(p, search));

    if (dateFilterActive && (startDate || endDate)) {
      list = list.filter((p) => isInDateRange(p.updatedAt, startDate, endDate));
    }

    // When competitor data is loaded, optionally prioritize matched rows — still show all
    list = [...list].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortOrder === 'asc' ? av - bv : bv - av;
      }
      const as = String(av ?? '').toLowerCase();
      const bs = String(bv ?? '').toLowerCase();
      if (as < bs) return sortOrder === 'asc' ? -1 : 1;
      if (as > bs) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [products, search, sortBy, sortOrder, dateFilterActive, startDate, endDate]);

  const totalFiltered = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));

  const pageProducts = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, page, limit]);

  // Precompute competitor matches for current page only (performance)
  const pageCompetitorMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof getCompetitorsForProduct>> = {};
    if (!hasScrapedData) return map;
    for (const product of pageProducts) {
      map[product.id] = getCompetitorsForProduct(
        product.id,
        scrapedData,
        sheetNames,
        product.salePrice
      );
    }
    return map;
  }, [pageProducts, scrapedData, sheetNames, hasScrapedData]);

  const minPriceCount = Object.keys(updatedPrices).length;
  const regularPriceCount = Object.keys(updatedRegularPrices).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSort = (column: SortKey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortBy !== column) return <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="inline h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="inline h-3 w-3 ml-1" />
    );
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast.error('Please upload a CSV or XLSX file');
      return;
    }

    setUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const { scrapedData: data, sheetNames: names } = parseCompetitorWorkbook(buffer);

      if (names.length === 0) {
        toast.error('No valid competitor sheets found (ProductID column required)');
        return;
      }

      dispatch(setScrapedData({ scrapedData: data, sheetNames: names }));
      toast.success(
        `Loaded ${names.length} sheet${names.length === 1 ? '' : 's'}: ${names.join(', ')}`
      );
      setPage(1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to parse file');
    } finally {
      setUploading(false);
    }
  };

  const handleFetchPriceUpdates = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    setShowHistoryModal(true);
    try {
      await dispatch(
        fetchPriceUpdateHistory({
          startDate,
          endDate,
          type: checkMode === 'regular' ? 'regular' : 'sale',
        })
      ).unwrap();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to fetch price history');
    }
  };

  const handleCancelDateFilter = () => {
    setCheckMode(null);
    setStartDate('');
    setEndDate('');
    setDateFilterActive(false);
    setShowHistoryModal(false);
    dispatch(clearPriceHistory());
    setPage(1);
  };

  const buildSaleUpdates = useCallback(
    (productIds: string[]) =>
      productIds
        .filter((id) => updatedPrices[id] != null)
        .map((productId) => ({
          productId,
          salePrice: updatedPrices[productId],
          competitor: selectedSaleCompetitorName[productId] || '',
        })),
    [updatedPrices, selectedSaleCompetitorName]
  );

  const buildRegularUpdates = useCallback(
    (productIds: string[]) =>
      productIds
        .filter((id) => updatedRegularPrices[id] != null)
        .map((productId) => ({
          productId,
          regularPrice: updatedRegularPrices[productId],
          competitor: selectedRegularCompetitorName[productId] || '',
        })),
    [updatedRegularPrices, selectedRegularCompetitorName]
  );

  const runSaleUpdate = async (productIds: string[]) => {
    const updates = buildSaleUpdates(productIds);
    if (updates.length === 0) {
      toast.error('No sale prices selected to update');
      return;
    }
    try {
      const result = await dispatch(bulkUpdateSalePrices(updates)).unwrap();
      toast.success(result.message || `Updated ${result.updated} products`);
      if ((result.skipped || []).length > 0) {
        setShowSkippedModal(true);
      } else {
        dispatch(clearSkippedProducts());
      }
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to update sale prices');
    }
  };

  const runRegularUpdate = async (productIds: string[]) => {
    const updates = buildRegularUpdates(productIds);
    if (updates.length === 0) {
      toast.error('No regular prices selected to update');
      return;
    }
    try {
      const result = await dispatch(bulkUpdateRegularPrices(updates)).unwrap();
      toast.success(result.message || `Updated ${result.updated} products`);
      if ((result.skipped || []).length > 0) {
        setShowSkippedModal(true);
      } else {
        dispatch(clearSkippedProducts());
      }
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to update regular prices');
    }
  };

  const handleUpdateSaleByDropdown = () => {
    if (!saleCompetitorSelect) {
      toast.error('Select a competitor first');
      return;
    }
    const ids = products.map((p) => p.id);
    dispatch(
      applyCompetitorToSelectedSale({
        competitor: saleCompetitorSelect,
        productIds: ids,
      })
    );
    const matchedIds = ids.filter((id) => {
      const key = id.trim().toLowerCase();
      return (scrapedData[saleCompetitorSelect]?.[key]?.salePrice || 0) > 0;
    });
    void runSaleUpdate(matchedIds);
  };

  const handleUpdateRegularByDropdown = () => {
    if (!regularCompetitorSelect) {
      toast.error('Select a competitor first');
      return;
    }
    const ids = products.map((p) => p.id);
    dispatch(
      applyCompetitorToSelectedRegular({
        competitor: regularCompetitorSelect,
        productIds: ids,
      })
    );
    const matchedIds = ids.filter((id) => {
      const key = id.trim().toLowerCase();
      return (scrapedData[regularCompetitorSelect]?.[key]?.regularPrice || 0) > 0;
    });
    void runRegularUpdate(matchedIds);
  };

  const pageRangeLabel = `1-${limit}`;

  // Update only selected items on the current page (driven by rows-per-page)
  const batchSaleIds = useMemo(
    () => pageProducts.filter((p) => selectedSkus.includes(p.id)).map((p) => p.id),
    [pageProducts, selectedSkus]
  );
  const batchRegularIds = useMemo(
    () =>
      pageProducts
        .filter((p) => selectedRegularSkus.includes(p.id))
        .map((p) => p.id),
    [pageProducts, selectedRegularSkus]
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Competitor Pricing</h1>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1e2a4a] text-white rounded-lg text-sm font-semibold hover:bg-[#162038] disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload File
          </button>
        </div>
      </div>

      {/* Controls card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setCheckMode(checkMode === 'sale' ? null : 'sale')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              checkMode === 'sale'
                ? 'bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-blue-400 text-blue-600 hover:bg-blue-50'
            }`}
          >
            Check Sale Price Updates
          </button>
          <button
            onClick={() => setCheckMode(checkMode === 'regular' ? null : 'regular')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
              checkMode === 'regular'
                ? 'bg-purple-50 border-purple-500 text-purple-600'
                : 'bg-white border-purple-400 text-purple-600 hover:bg-purple-50'
            }`}
          >
            Check Regular Price Updates
          </button>
        </div>

        {/* Date range panel */}
        {checkMode && (
          <div className="flex flex-wrap items-end gap-3 pt-1 leading-[22px]">
            <p className="w-full text-sm font-semibold text-gray-700">
              Select Date Range for {checkMode === 'sale' ? 'Sale' : 'Regular'} Price:
            </p>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm pr-9"
                />
                <Calendar className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm pr-9"
                />
                <Calendar className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <button
              onClick={handleFetchPriceUpdates}
              disabled={!datesReady || historyLoading}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
                datesReady
                  ? 'bg-[#00a65a] text-white hover:bg-[#008d4c]'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {historyLoading ? 'Fetching...' : 'Fetch Price Updates'}
            </button>
            <button
              onClick={handleCancelDateFilter}
              className="px-4 py-2 rounded-lg text-sm font-semibold border border-orange-400 text-orange-500 hover:bg-orange-50"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Search + total */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </form>
          <p className="text-sm font-bold text-gray-900">
            Total: {dateFilterActive || search ? totalFiltered : total || products.length}
          </p>
        </div>

        {/* Competitor controls — visible after upload */}
        {hasScrapedData && (
          <>
            {/* Shared control sizing: all cells same height/width in a 4-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              <select
                value={saleCompetitorSelect}
                onChange={(e) => setSaleCompetitorSelect(e.target.value)}
                className="w-full h-11 min-h-[44px] border border-gray-300 rounded-lg px-3 text-sm text-gray-700 bg-white"
              >
                <option value="">Select Competitor</option>
                {sheetNames.map((name) => (
                  <option key={`sale-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateSaleByDropdown}
                disabled={!saleCompetitorSelect || updating}
                className={`w-full h-11 min-h-[44px] px-3 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                  saleCompetitorSelect
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                Update Sale Prices
              </button>

              <select
                value={regularCompetitorSelect}
                onChange={(e) => setRegularCompetitorSelect(e.target.value)}
                className="w-full h-11 min-h-[44px] border border-gray-300 rounded-lg px-3 text-sm text-gray-700 bg-white"
              >
                <option value="">Select Competitor</option>
                {sheetNames.map((name) => (
                  <option key={`reg-${name}`} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpdateRegularByDropdown}
                disabled={!regularCompetitorSelect || updating}
                className={`w-full h-11 min-h-[44px] px-3 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                  regularCompetitorSelect
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                Update Regular Prices
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
              <button
                onClick={() => dispatch(selectAllMinPrices())}
                className="w-full h-11 min-h-[44px] px-3 rounded-lg text-sm font-semibold border border-blue-500 text-blue-600 hover:bg-blue-50 inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Check className="h-4 w-4 shrink-0" />
                Select All Min Prices ({minPriceCount})
              </button>
              <button
                onClick={() => runSaleUpdate(batchSaleIds)}
                disabled={updating || batchSaleIds.length === 0}
                className="w-full h-11 min-h-[44px] px-3 rounded-lg text-sm font-semibold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                {pageRangeLabel} Sale Price Update ({batchSaleIds.length})
              </button>
              <button
                onClick={() => dispatch(selectAllRegularPrices())}
                className="w-full h-11 min-h-[44px] px-3 rounded-lg text-sm font-semibold border border-purple-500 text-purple-600 hover:bg-purple-50 inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Check className="h-4 w-4 shrink-0" />
                Select All Regular Prices ({regularPriceCount})
              </button>
              <button
                onClick={() => runRegularUpdate(batchRegularIds)}
                disabled={updating || batchRegularIds.length === 0}
                className="w-full h-11 min-h-[44px] px-3 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <RefreshCw className="h-4 w-4 shrink-0" />
                {pageRangeLabel} Regular Price Update ({batchRegularIds.length})
              </button>
            </div>

            {/* Row: Set {Competitor} Regular Prices — same height/width cells */}
            <div
              className="grid gap-3 items-stretch"
              style={{
                gridTemplateColumns: `repeat(${Math.max(sheetNames.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {sheetNames.map((name) => {
                const theme = getCompetitorTheme(name, sheetNames);
                const short = competitorShortName(name);
                const regularActive = activeRegularSourceCompetitor === name;
                const anyRegularActive = !!activeRegularSourceCompetitor;
                const regularColored = regularActive || !anyRegularActive;

                return (
                  <button
                    key={`reg-btn-${name}`}
                    onClick={() => {
                      dispatch(setCompetitorRegularPrices(name));
                      toast.success(`${short} regular prices applied`);
                    }}
                    className="w-full h-11 min-h-[44px] px-2 rounded-lg text-sm font-bold text-white transition-colors shadow-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{
                      backgroundColor: regularColored ? theme.hex : '#d1d5db',
                    }}
                  >
                    Set {short} Regular Prices
                  </button>
                );
              })}
            </div>

            {/* Row: Set {Competitor} Sale Prices — same height/width cells */}
            <div
              className="grid gap-3 items-stretch"
              style={{
                gridTemplateColumns: `repeat(${Math.max(sheetNames.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {sheetNames.map((name) => {
                const theme = getCompetitorTheme(name, sheetNames);
                const short = competitorShortName(name);
                const saleActive = activeSaleSourceCompetitor === name;
                const anySaleActive = !!activeSaleSourceCompetitor;
                const saleColored = saleActive || !anySaleActive;

                return (
                  <button
                    key={`sale-btn-${name}`}
                    onClick={() => {
                      dispatch(setCompetitorSalePrices(name));
                      toast.success(`${short} sale prices applied`);
                    }}
                    className="w-full h-11 min-h-[44px] px-2 rounded-lg text-sm font-bold text-white transition-colors shadow-sm whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{
                      backgroundColor: saleColored ? theme.hex : '#d1d5db',
                    }}
                  >
                    Set {short} Sale Prices
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading products...
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm leading-[22px] min-w-[1400px]">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-left border-b border-gray-200">
                    <th
                      className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('sku')}
                    >
                      SKU <SortIcon column="sku" />
                    </th>
                    <th
                      className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('brand')}
                    >
                      Brand <SortIcon column="brand" />
                    </th>
                    <th
                      className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('model')}
                    >
                      Model <SortIcon column="model" />
                    </th>
                    <th
                      className="px-3 py-3 font-semibold whitespace-nowrap cursor-pointer"
                      onClick={() => handleSort('tireSize')}
                    >
                      Tire Size <SortIcon column="tireSize" />
                    </th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Cost</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Shipping</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Fin. Cost</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Net Cost</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Sale Price</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Margin($)</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Margin(%)</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">MAP</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Regular Price</th>
                    <th className="px-3 py-3 font-semibold whitespace-nowrap">Stock</th>
                    {hasScrapedData && (
                      <>
                        <th className="px-3 py-3 font-semibold whitespace-nowrap">Set New Price</th>
                        <th className="px-3 py-3 font-semibold whitespace-nowrap">
                          Price Match Margin (%)
                        </th>
                        <th className="px-3 py-3 font-semibold whitespace-nowrap">
                          Price Match Margin ($)
                        </th>
                        <th className="px-3 py-3 font-semibold whitespace-nowrap">
                          Set Regular Price
                        </th>
                        {sheetNames.map((name) => (
                          <React.Fragment key={`h-${name}`}>
                            <th className="px-3 py-3 font-semibold whitespace-nowrap text-slate-500">
                              {name} Title
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 leading-[22px] max-w-[90px]">
                              {competitorPriceColumnLabel(name)}
                            </th>
                            <th className="px-3 py-3 font-semibold text-slate-500 leading-[22px] max-w-[90px]">
                              {competitorRegularColumnLabel(name)}
                            </th>
                            <th className="px-3 py-3 font-semibold whitespace-nowrap text-slate-500">
                              {name} Stock
                            </th>
                            <th className="px-3 py-3 font-semibold whitespace-nowrap text-slate-500">
                              {name} URL
                            </th>
                            <th className="px-3 py-3 font-semibold whitespace-nowrap text-slate-500">
                              {name} Diff
                            </th>
                          </React.Fragment>
                        ))}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={hasScrapedData ? 20 + sheetNames.length * 6 : 14}
                        className="px-4 py-16 text-center text-gray-400"
                      >
                        No products found
                      </td>
                    </tr>
                  ) : (
                    pageProducts.map((product) => {
                      const { marginDollar, marginPercent } = calcMargins(
                        product.salePrice,
                        product.netCost
                      );
                      const saleSelected = selectedSkus.includes(product.id);
                      const regularSelected = selectedRegularSkus.includes(product.id);
                      const competitors = pageCompetitorMap[product.id] || [];
                      const competitorByName = Object.fromEntries(
                        competitors.map((c) => [c.name, c])
                      );
                      const lowest = pickLowestCompetitor(competitors);
                      const lowestCompetitorPrice = lowest?.salePrice;

                      // New Price: user-edited suggested price, else lowest competitor
                      const newPrice =
                        updatedPrices[product.id] !== undefined
                          ? updatedPrices[product.id]
                          : lowestCompetitorPrice;

                      const newSale = updatedPrices[product.id];
                      const newRegular = updatedRegularPrices[product.id];
                      const saleCompetitor = selectedSaleCompetitorName[product.id];

                      // Price Match Margin = New Price - Current Sale Price (not profit margin)
                      const pm = calcPriceMatchMargins(newPrice, product.salePrice);
                      const pmColor = priceMatchMarginColorClass(pm.dollar);

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-gray-100 hover:bg-gray-50/50"
                        >
                          <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                            {product.sku}
                          </td>
                          <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                            {product.brand}
                          </td>
                          <td className="px-3 py-3 text-gray-800 max-w-[140px]">
                            <span className="line-clamp-2">{product.model}</span>
                          </td>
                          <td className="px-3 py-3 text-gray-800 whitespace-nowrap">
                            {product.tireSize}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.cost)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.shipping)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.financeCost)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.netCost)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.salePrice)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-semibold text-green-600">
                            {formatMoney(marginDollar)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap font-semibold text-green-600">
                            {marginPercent.toFixed(2)}%
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.mapPrice)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            {formatMoney(product.regularPrice)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">{product.stock}</td>

                          {hasScrapedData && (
                            <>
                              {/* Set New Price */}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5 min-w-[220px]">
                                  <input
                                    type="number"
                                    value={newSale ?? ''}
                                    onChange={(e) =>
                                      dispatch(
                                        setSalePrice({
                                          productId: product.id,
                                          price: toNumber(e.target.value),
                                        })
                                      )
                                    }
                                    className="w-16 border border-gray-300 rounded-md px-1.5 py-1 text-sm text-pink-600 font-medium"
                                  />
                                  {saleCompetitor && (
                                    <span
                                      className="px-2.5 py-0.5 rounded-lg text-white text-xs font-semibold whitespace-nowrap shadow-sm"
                                      style={{
                                        backgroundColor: getCompetitorTheme(
                                          saleCompetitor,
                                          sheetNames
                                        ).hex,
                                      }}
                                    >
                                      {saleCompetitor}
                                    </span>
                                  )}
                                  <button
                                    onClick={() =>
                                      dispatch(
                                        toggleSaleSelection({
                                          productId: product.id,
                                          selected: true,
                                        })
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                      saleSelected
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-green-600 border-green-500'
                                    }`}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() =>
                                      dispatch(
                                        toggleSaleSelection({
                                          productId: product.id,
                                          selected: false,
                                        })
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                      !saleSelected
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-white text-red-500 border-red-400'
                                    }`}
                                  >
                                    No
                                  </button>
                                </div>
                              </td>

                              <td
                                className={`px-3 py-3 whitespace-nowrap font-semibold leading-[22px] ${pmColor}`}
                              >
                                {pm.percent != null ? `${pm.percent.toFixed(2)}%` : '-'}
                              </td>
                              <td
                                className={`px-3 py-3 whitespace-nowrap font-semibold leading-[22px] ${pmColor}`}
                              >
                                {pm.dollar != null
                                  ? formatPriceMatchMarginDollar(pm.dollar)
                                  : '-'}
                              </td>

                              {/* Set Regular Price */}
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5 min-w-[140px]">
                                  <input
                                    type="number"
                                    value={newRegular ?? ''}
                                    onChange={(e) =>
                                      dispatch(
                                        setRegularPrice({
                                          productId: product.id,
                                          price: toNumber(e.target.value),
                                        })
                                      )
                                    }
                                    className="w-16 border border-gray-300 rounded-md px-1.5 py-1 text-sm text-red-600 font-medium"
                                  />
                                  <button
                                    onClick={() =>
                                      dispatch(
                                        toggleRegularSelection({
                                          productId: product.id,
                                          selected: !regularSelected,
                                        })
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                      regularSelected
                                        ? 'bg-green-600 text-white border-green-600'
                                        : 'bg-white text-green-600 border-green-500'
                                    }`}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    onClick={() =>
                                      dispatch(
                                        toggleRegularSelection({
                                          productId: product.id,
                                          selected: false,
                                        })
                                      )
                                    }
                                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                      !regularSelected
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-white text-orange-500 border-orange-400'
                                    }`}
                                  >
                                    No
                                  </button>
                                </div>
                              </td>

                              {sheetNames.map((name) => {
                                const c = competitorByName[name];
                                const theme = getCompetitorTheme(name, sheetNames);
                                const saleSelectedHere =
                                  selectedSaleCompetitorName[product.id] === name;
                                const regularSelectedHere =
                                  selectedRegularCompetitorName[product.id] === name;

                                return (
                                  <React.Fragment key={`${product.id}-${name}`}>
                                    <td className="px-3 py-3 max-w-[160px] truncate text-gray-600">
                                      {c?.title || '-'}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-center">
                                      {c && c.salePrice > 0 ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            dispatch(
                                              selectCompetitorSaleForProduct({
                                                productId: product.id,
                                                competitor: name,
                                              })
                                            )
                                          }
                                          className={
                                            saleSelectedHere
                                              ? COMPETITOR_PRICE_BTN_ACTIVE
                                              : COMPETITOR_PRICE_BTN_IDLE
                                          }
                                          style={
                                            saleSelectedHere
                                              ? { backgroundColor: theme.hex }
                                              : undefined
                                          }
                                        >
                                          {formatMoney(c.salePrice)}
                                        </button>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap text-center">
                                      {c && c.regularPrice > 0 ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            dispatch(
                                              selectCompetitorRegularForProduct({
                                                productId: product.id,
                                                competitor: name,
                                              })
                                            )
                                          }
                                          className={
                                            regularSelectedHere
                                              ? COMPETITOR_PRICE_BTN_ACTIVE
                                              : COMPETITOR_PRICE_BTN_IDLE
                                          }
                                          style={
                                            regularSelectedHere
                                              ? { backgroundColor: theme.hex }
                                              : undefined
                                          }
                                        >
                                          {formatMoney(c.regularPrice)}
                                        </button>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      {c ? c.stock : '-'}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      {c?.url ? (
                                        <a
                                          href={c.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline font-medium"
                                        >
                                          View
                                        </a>
                                      ) : (
                                        '-'
                                      )}
                                    </td>
                                    <td className="px-3 py-3 whitespace-nowrap">
                                      {c ? c.diff.toFixed(2) : '-'}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1"
                >
                  {[25, 50, 100, 200].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </div>

      <SkippedProductsModal
        open={showSkippedModal && skippedProducts.length > 0}
        products={skippedProducts}
        onClose={() => {
          setShowSkippedModal(false);
          dispatch(clearSkippedProducts());
        }}
      />

      <PriceHistoryModal
        open={showHistoryModal}
        title={
          checkMode === 'regular' ? 'Regular Price History' : 'Sale Price History'
        }
        rows={priceHistory}
        loading={historyLoading}
        onClose={() => {
          setShowHistoryModal(false);
          dispatch(clearPriceHistory());
        }}
      />
    </div>
  );
}
