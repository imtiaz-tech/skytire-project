'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, CircleDot, ArrowUp, ArrowDown, ArrowUpDown, Eye, EyeOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTires, deleteTire, bulkUpdateTires } from '@/redux/slices/tiresSlice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import TirePreviewModal from '@/components/admin/TirePreviewModal';
import Link from 'next/link';
import { Tire } from '@/redux/types/tireTypes';
import toast from 'react-hot-toast';

type TabType = 'BLACK_WALL' | 'WHITE_WALL' | 'DRAFT' | 'VISIBLE' | 'INVISIBLE';

export default function TiresPage() {
  const dispatch = useAppDispatch();
  const { tires, loading, total, pages, currentPage } = useAppSelector((state) => state.tires);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('BLACK_WALL');
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modal State - Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tireToDelete, setTireToDelete] = useState<string | null>(null);

  // Modal State - Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTire, setPreviewTire] = useState<Tire | null>(null);

  // Derived
  const isBulkTab = activeTab === 'VISIBLE' || activeTab === 'INVISIBLE';

  // Build fetch params
  const buildParams = useCallback(() => {
    const params: any = { page, limit, search, sortBy, sortOrder };
    if (activeTab === 'DRAFT') {
      params.publishStatus = 'DRAFT';
    } else if (activeTab === 'VISIBLE') {
      params.isActive = true;
    } else if (activeTab === 'INVISIBLE') {
      params.isActive = false;
    } else {
      params.publishStatus = 'PUBLISHED';
      params.sidewallCategory = activeTab;
    }
    return params;
  }, [page, limit, search, activeTab, sortBy, sortOrder]);

  useEffect(() => {
    dispatch(fetchTires(buildParams()));
  }, [dispatch, buildParams]);

  // Clear selection on tab / page / search change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const openDeleteModal = (id: string) => {
    setTireToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openPreview = (tire: Tire) => {
    setPreviewTire(tire);
    setIsPreviewOpen(true);
  };

  const confirmDelete = async () => {
    if (tireToDelete) {
      try {
        await dispatch(deleteTire(tireToDelete)).unwrap();
        toast.success('Tire deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete tire');
      } finally {
        setIsDeleteModalOpen(false);
        setTireToDelete(null);
      }
    }
  };

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const allChecked = tires.length > 0 && tires.every((t) => selectedIds.has(t.id));
  const someChecked = tires.some((t) => selectedIds.has(t.id)) && !allChecked;

  const toggleSelectAll = () => {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tires.map((t) => t.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk Action ───────────────────────────────────────────────────────────
  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    const targetIsActive = activeTab === 'INVISIBLE'; // Invisible→make active; Visible→make inactive
    setBulkLoading(true);
    try {
      await dispatch(bulkUpdateTires({ ids: Array.from(selectedIds), isActive: targetIsActive })).unwrap();
      toast.success(
        `${selectedIds.size} tire${selectedIds.size > 1 ? 's' : ''} marked as ${targetIsActive ? 'Visible' : 'Invisible'}`
      );
      setSelectedIds(new Set());
      dispatch(fetchTires(buildParams()));
    } catch (error: any) {
      toast.error(error.message || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy === col) {
      return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3 text-gray-200" />;
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'BLACK_WALL', label: 'Black Wall Tires' },
    { id: 'WHITE_WALL', label: 'White Wall Tires' },
    { id: 'DRAFT', label: 'Drafts' },
    { id: 'VISIBLE', label: 'Visible' },
    { id: 'INVISIBLE', label: 'Invisible' },
  ];

  const searchPlaceholder =
    activeTab === 'DRAFT' ? 'Search Drafts...'
    : activeTab === 'VISIBLE' ? 'Search Visible...'
    : activeTab === 'INVISIBLE' ? 'Search Invisible...'
    : 'Search Tires...';

  const bulkButtonLabel = activeTab === 'VISIBLE' ? 'Make Invisible' : 'Make Visible';
  const bulkButtonIcon = activeTab === 'VISIBLE'
    ? <EyeOff className="h-4 w-4" />
    : <Eye className="h-4 w-4" />;

  // colSpan: 11 base columns + 1 checkbox when isBulkTab
  const colSpan = isBulkTab ? 12 : 11;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <CircleDot className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Tires List</h1>
        </div>
        <Link
          href="/admin/tires/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add New Tire
        </Link>
      </div>

      {/* Filter Bar & Tabs Combined */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Section */}
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[16px] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all font-medium"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#2a3a5a] transition-all shadow-md shadow-blue-50"
            >
              Search
            </button>
          </form>

          {/* Separator & Tabs */}
          <div className="flex items-center gap-8 flex-1">
            <div className="h-10 w-px bg-gray-100 hidden md:block ml-2" />

            <div className="flex items-center gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-2 text-[15px] font-bold transition-all relative whitespace-nowrap ${
                    activeTab === tab.id ? 'text-[#1e2a4a]' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-[-20px] left-0 right-0 h-[3px] bg-[#1e2a4a] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto text-[15px] font-bold text-gray-700 whitespace-nowrap">
              Total Tires: <span className="text-[#1e2a4a]">({total})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tires Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                {/* Checkbox column — only on Visible/Invisible tabs */}
                {isBulkTab && (
                  <th className="px-6 py-5 w-12">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = someChecked; }}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] cursor-pointer accent-[#1e2a4a]"
                      title="Select All"
                    />
                  </th>
                )}
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center gap-2">
                    SKU
                    <SortIcon col="sku" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('tireSize')}
                >
                  <div className="flex items-center gap-2">
                    Tire Size
                    <SortIcon col="tireSize" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('alternatePartNumber')}
                >
                  <div className="flex items-center gap-2">
                    Alt Part #
                    <SortIcon col="alternatePartNumber" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('upcNo')}
                >
                  <div className="flex items-center gap-2">
                    UPC No
                    <SortIcon col="upcNo" />
                  </div>
                </th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand/Model</th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('cost')}
                >
                  <div className="flex items-center gap-2">
                    Cost
                    <SortIcon col="cost" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('salePrice')}
                >
                  <div className="flex items-center gap-2">
                    Sale
                    <SortIcon col="salePrice" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('regularPrice')}
                >
                  <div className="flex items-center gap-2">
                    Regular
                    <SortIcon col="regularPrice" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('mapPrice')}
                >
                  <div className="flex items-center gap-2">
                    MAP
                    <SortIcon col="mapPrice" />
                  </div>
                </th>
                <th
                  className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center gap-2">
                    Stock
                    <SortIcon col="stock" />
                  </div>
                </th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={colSpan} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Fetching tires...</p>
                    </div>
                  </td>
                </tr>
              ) : tires.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="h-6 w-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-semibold">No tires found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tires.map((tire) => {
                  const isChecked = selectedIds.has(tire.id);
                  return (
                    <tr
                      key={tire.id}
                      className={`hover:bg-gray-50/50 transition-all group ${isBulkTab && isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      {isBulkTab && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(tire.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] cursor-pointer accent-[#1e2a4a]"
                          />
                        </td>
                      )}
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div
                          className="text-[15px] font-bold text-[#1e2a4a] cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => openPreview(tire)}
                          title="Click to preview"
                        >
                          {tire.sku}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div
                          className="text-[15px] font-bold text-[#1e2a4a] cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => openPreview(tire)}
                          title="Click to preview"
                        >
                          {tire.tireSize || 'Unknown Size'}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-gray-600">
                          {tire.alternatePartNumber || <span className="text-gray-300 italic">-</span>}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-gray-600">
                          {tire.upcNo || <span className="text-gray-300 italic">-</span>}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div
                          className="text-[15px] font-bold text-[#1e2a4a] cursor-pointer hover:opacity-70 transition-opacity"
                          onClick={() => openPreview(tire)}
                          title="Click to preview"
                        >
                          {tire.model?.brand?.brandName} / {tire.model?.modelName}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-[#1e2a4a]">
                          {tire.cost}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-green-600">
                          {tire.salePrice}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-[#1e2a4a]">
                          {tire.regularPrice}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-[#1e2a4a]">
                          {tire.mapPrice}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[15px] font-bold text-[#1e2a4a]">
                          {tire.stock}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/admin/tires/edit/${tire.id}`}
                            className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(tire.id)}
                            className="w-10 h-10 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination + Bulk Action */}
        {!loading && tires.length > 0 && (
          <div className="px-8 py-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            {/* Bulk action button — left side, only on Visible/Invisible tabs */}
            {isBulkTab ? (
              <button
                onClick={handleBulkAction}
                disabled={selectedIds.size === 0 || bulkLoading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  selectedIds.size === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : activeTab === 'VISIBLE'
                    ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                    : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
                }`}
              >
                {bulkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  bulkButtonIcon
                )}
                {bulkButtonLabel}
                {selectedIds.size > 0 && (
                  <span className="ml-1 bg-white/30 rounded-full px-1.5 py-0.5 text-xs">
                    {selectedIds.size}
                  </span>
                )}
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-6">
              <div className="text-sm font-medium text-gray-400">
                Page <span className="text-[#1e2a4a] font-bold">{currentPage}</span> of{' '}
                <span className="text-[#1e2a4a] font-bold">{pages}</span>
              </div>
              <Pagination
                currentPage={page}
                totalPages={pages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Tire"
        message="Are you sure you want to delete this tire? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <TirePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        tire={previewTire}
      />
    </div>
  );
}
