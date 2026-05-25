'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Plus, Edit2, Trash2, CircleDot, Copy,
  ArrowUp, ArrowDown, ArrowUpDown, Eye, EyeOff, Wrench
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchWireWheels, deleteWireWheel, bulkUpdateWireWheels } from '@/features/wire-wheels/slice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import WireWheelPreviewModal from '@/components/admin/WireWheelPreviewModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WireWheel } from '@/redux/types/wireWheelTypes';
import toast from 'react-hot-toast';

type TabType = 'PUBLISHED' | 'DRAFT' | 'VISIBLE' | 'INVISIBLE';

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function WireWheelsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { wireWheels, loading, total, pages, currentPage } = useAppSelector((state) => state.wireWheels);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('PUBLISHED');
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modal State - Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [wireWheelToDelete, setWireWheelToDelete] = useState<string | null>(null);

  // Modal State - Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedWireWheel, setSelectedWireWheel] = useState<WireWheel | null>(null);

  // Determine if current tab is a bulk-action tab
  const isBulkTab = activeTab === 'VISIBLE' || activeTab === 'INVISIBLE';

  // Build fetch params based on active tab
  const buildParams = useCallback(() => {
    const params: any = { page, limit, search, sortBy, sortOrder };
    if (activeTab === 'PUBLISHED') params.status = 'published';
    else if (activeTab === 'DRAFT') params.status = 'draft';
    else if (activeTab === 'VISIBLE') params.isActive = true;
    else if (activeTab === 'INVISIBLE') params.isActive = false;
    return params;
  }, [page, limit, search, activeTab, sortBy, sortOrder]);

  useEffect(() => {
    dispatch(fetchWireWheels(buildParams()));
  }, [dispatch, buildParams]);

  // Clear selection when tab or page changes
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
    setWireWheelToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDuplicate = (id: string) => {
    sessionStorage.setItem('duplicateWireWheelId', id);
    router.push('/admin/wire-wheels/add');
  };

  const openPreview = (wireWheel: WireWheel) => {
    setSelectedWireWheel(wireWheel);
    setIsPreviewOpen(true);
  };

  const confirmDelete = async () => {
    if (wireWheelToDelete) {
      try {
        await dispatch(deleteWireWheel(wireWheelToDelete)).unwrap();
        toast.success('Wire Wheel deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete wire wheel');
      } finally {
        setIsDeleteModalOpen(false);
        setWireWheelToDelete(null);
      }
    }
  };

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const allChecked = wireWheels.length > 0 && wireWheels.every((w) => selectedIds.has(w.id));
  const someChecked = wireWheels.some((w) => selectedIds.has(w.id)) && !allChecked;

  const toggleSelectAll = () => {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wireWheels.map((w) => w.id)));
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
      await dispatch(bulkUpdateWireWheels({ ids: Array.from(selectedIds), isActive: targetIsActive })).unwrap();
      toast.success(
        `${selectedIds.size} wire wheel${selectedIds.size > 1 ? 's' : ''} marked as ${targetIsActive ? 'Visible' : 'Invisible'}`
      );
      setSelectedIds(new Set());
      // Re-fetch to reflect removed items from this filtered tab
      dispatch(fetchWireWheels(buildParams()));
    } catch (error: any) {
      toast.error(error.message || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy === col) {
      return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3 text-gray-200" />;
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'PUBLISHED', label: 'Published' },
    { id: 'DRAFT', label: 'Drafts' },
    { id: 'VISIBLE', label: 'Visible' },
    { id: 'INVISIBLE', label: 'Invisible' },
  ];

  // Search placeholder
  const searchPlaceholder =
    activeTab === 'DRAFT' ? 'Search Drafts...'
    : activeTab === 'VISIBLE' ? 'Search Visible...'
    : activeTab === 'INVISIBLE' ? 'Search Invisible...'
    : 'Search Wire Wheels...';

  // Bulk button label
  const bulkButtonLabel =
    activeTab === 'VISIBLE' ? 'Make Invisible' : 'Make Visible';

  const bulkButtonIcon =
    activeTab === 'VISIBLE' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <CircleDot className="h-5 w-5 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Wire Wheels List</h1>
        </div>
        <Link
          href="/admin/wire-wheels/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add Wire Wheel
        </Link>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
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
                    <div className="absolute bottom-[-20px] left-0 right-0 h-[3px] bg-[#1e2a4a] rounded-full animate-in slide-in-from-left duration-200" />
                  )}
                </button>
              ))}
            </div>

            <div className="ml-auto text-[15px] font-bold text-gray-700 whitespace-nowrap">
              Total Wire Wheels: <span className="text-[#1e2a4a]">({total})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                {/* Checkbox column (only on Visible/Invisible tabs) */}
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
                {/* Name + Image */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <SortIcon col="name" />
                  </div>
                </th>
                {/* SKU */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center gap-2">
                    SKU
                    <SortIcon col="sku" />
                  </div>
                </th>
                {/* Size */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('size')}
                >
                  <div className="flex items-center gap-2">
                    Size
                    <SortIcon col="size" />
                  </div>
                </th>
                {/* Brand */}
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand</th>
                {/* Inventory Source */}
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Source</th>
                {/* Cost */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('cost')}
                >
                  <div className="flex items-center gap-2">
                    Cost
                    <SortIcon col="cost" />
                  </div>
                </th>
                {/* Sale Price */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('salePrice')}
                >
                  <div className="flex items-center gap-2">
                    Sale
                    <SortIcon col="salePrice" />
                  </div>
                </th>
                {/* Regular Price */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('regularPrice')}
                >
                  <div className="flex items-center gap-2">
                    Regular
                    <SortIcon col="regularPrice" />
                  </div>
                </th>
                {/* Stock */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('stock')}
                >
                  <div className="flex items-center gap-2">
                    Stock
                    <SortIcon col="stock" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={isBulkTab ? 12 : 11} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Fetching wire wheels...</p>
                    </div>
                  </td>
                </tr>
              ) : wireWheels.length === 0 ? (
                <tr>
                  <td colSpan={isBulkTab ? 12 : 11} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Wrench className="h-6 w-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-semibold">No wire wheels found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                wireWheels.map((wheel) => {
                  const firstImage = wheel.images && wheel.images.length > 0 ? getImageUrl(wheel.images[0]) : null;
                  const isChecked = selectedIds.has(wheel.id);
                  return (
                    <tr
                      key={wheel.id}
                      className={`hover:bg-gray-50/50 transition-all group ${isBulkTab && isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Checkbox */}
                      {isBulkTab && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(wheel.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] cursor-pointer accent-[#1e2a4a]"
                          />
                        </td>
                      )}

                      {/* Name + Image */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="flex items-center gap-3 text-left group/name hover:opacity-80 transition-opacity"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center">
                            {firstImage ? (
                              <img src={firstImage} alt={wheel.name} className="w-full h-full object-cover" />
                            ) : (
                              <CircleDot className="h-5 w-5 text-gray-200" />
                            )}
                          </div>
                          <span className="text-[14px] font-bold text-[#1e2a4a] group-hover/name:text-blue-600 transition-colors max-w-[300px] truncate">
                            {wheel.name}
                          </span>
                        </button>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-bold text-[#1e2a4a] hover:text-blue-600 transition-colors underline-offset-2"
                        >
                          {wheel.sku}
                        </button>
                      </td>

                      {/* Size */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-bold text-gray-600 hover:text-blue-600 transition-colors underline-offset-2"
                        >
                          {wheel.size || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
                      </td>

                      {/* Brand */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-bold text-gray-600 hover:text-blue-600 transition-colors underline-offset-2"
                        >
                          {wheel.brand?.brandName || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
                      </td>

                      {/* Inventory Source */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[14px] font-bold text-gray-500">
                          {wheel.source?.source || <span className="text-gray-300 italic font-normal">—</span>}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[14px] font-bold text-[#1e2a4a]">
                          ${wheel.cost.toFixed(2)}
                        </div>
                      </td>

                      {/* Sale Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[14px] font-bold text-green-600">
                          ${wheel.salePrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Regular Price */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-[14px] font-bold text-[#1e2a4a]">
                          ${wheel.regularPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-[14px] font-bold ${wheel.stock <= 0 ? 'text-red-500' : 'text-[#1e2a4a]'}`}>
                          {wheel.stock}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            // onClick={() => handleDuplicate(wheel.id)}
                            className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/admin/wire-wheels/edit/${wheel.id}`}
                            className="w-9 h-9 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all shadow-sm"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => openDeleteModal(wheel.id)}
                            className="w-9 h-9 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
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

        {!loading && wireWheels.length > 0 && (
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
        title="Delete Wire Wheel"
        message="Are you sure you want to delete this wire wheel? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <WireWheelPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        wireWheel={selectedWireWheel}
      />
    </div>
  );
}
