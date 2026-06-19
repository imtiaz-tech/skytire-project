'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, Truck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchShippings, deleteShipping } from '@/features/shipping/slice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import ShippingFormModal from '@/components/admin/ShippingFormModal';
import {
  Shipping,
  ShippingCategory,
  SHIPPING_TAB_LABELS,
  isAccessoryShippingCategory,
} from '@/redux/types/shippingTypes';
import { ACCESSORY_ENUM_TO_LABEL } from '@/constants/shippingAccessoryCategories';
import toast from 'react-hot-toast';

const TABS: ShippingCategory[] = [
  'TIRE',
  'WHEEL',
  'WIRE_WHEEL',
  'BOLT_ON_WIRE_WHEEL',
  'ACCESSORY',
];

export default function ShippingPage() {
  const dispatch = useAppDispatch();
  const { shippings, loading, total, pages, currentPage } = useAppSelector((state) => state.shipping);

  const [activeTab, setActiveTab] = useState<ShippingCategory>('TIRE');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const limit = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Shipping | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const isAccessoryTab = isAccessoryShippingCategory(activeTab);

  const loadShippings = useCallback(() => {
    dispatch(fetchShippings({ category: activeTab, page, limit, search }));
  }, [dispatch, activeTab, page, limit, search]);

  useEffect(() => {
    loadShippings();
  }, [loadShippings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (tab: ShippingCategory) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
    setSearchInput('');
  };

  const openAddModal = () => {
    setEditRecord(null);
    setIsFormOpen(true);
  };

  const openEditModal = (record: Shipping) => {
    setEditRecord(record);
    setIsFormOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await dispatch(deleteShipping(recordToDelete)).unwrap();
      toast.success('Shipping record deleted successfully');
      loadShippings();
    } catch (error: unknown) {
      const err = error as string;
      toast.error(typeof err === 'string' ? err : 'Failed to delete shipping record');
    } finally {
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const formatDimensions = (record: Shipping) =>
    `${record.length} × ${record.width} × ${record.height}`;

  const formatCreatedDate = (date?: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getAccessoryCategoryLabel = (record: Shipping) =>
    record.accessoryCategory ? ACCESSORY_ENUM_TO_LABEL[record.accessoryCategory] : '—';

  const columnCount = isAccessoryTab ? 8 : 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Truck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Shipping</h1>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add Shipping
        </button>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab
                ? 'bg-[#1e2a4a] text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            {SHIPPING_TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder={
                  isAccessoryTab
                    ? 'Search accessory category, weight, dimensions, or shipping rate...'
                    : 'Search size, weight, dimensions, or shipping rate...'
                }
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-base focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all font-medium"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="bg-[#1e2a4a] text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-[#2a3a5a] transition-all shadow-md shadow-blue-50"
            >
              Search
            </button>
          </form>
          <div className="text-[15px] font-bold text-gray-700 whitespace-nowrap">
            Total: <span className="text-[#1e2a4a]">({total})</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                {isAccessoryTab ? (
                  <>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Accessory Category</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Weight</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Length</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Width</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Height</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Shipping Rate</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Created Date</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em] text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Size</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Weight</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Dimensions (L × W × H)</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em]">Shipping Rate</th>
                    <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.08em] text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Loading shipping records...</p>
                    </div>
                  </td>
                </tr>
              ) : shippings.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-20 text-center">
                    <p className="text-gray-400 font-semibold">No shipping records found</p>
                  </td>
                </tr>
              ) : isAccessoryTab ? (
                shippings.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] font-bold text-[#1e2a4a]">
                      {getAccessoryCategoryLabel(record)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">{record.weight}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">{record.length}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">{record.width}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">{record.height}</td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] font-bold text-green-600">
                      ${record.shippingRate.toFixed(2)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">
                      {formatCreatedDate(record.createdAt)}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(record)}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(record.id)}
                          className="w-10 h-10 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                shippings.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] font-bold text-[#1e2a4a]">
                      {record.size}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">
                      {record.weight}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] text-gray-600">
                      {formatDimensions(record)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[15px] font-bold text-green-600">
                      ${record.shippingRate.toFixed(2)}
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(record)}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(record.id)}
                          className="w-10 h-10 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && shippings.length > 0 && (
          <div className="px-6 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-400">
              Page <span className="text-[#1e2a4a] font-bold">{currentPage}</span> of{' '}
              <span className="text-[#1e2a4a] font-bold">{pages}</span>
            </div>
            <Pagination currentPage={page} totalPages={pages} onPageChange={(p) => setPage(p)} />
          </div>
        )}
      </div>

      <ShippingFormModal
        key={activeTab}
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadShippings}
        category={activeTab}
        isAccessoryMode={isAccessoryTab}
        editRecord={editRecord}
      />

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Shipping Record"
        message="Are you sure you want to delete this shipping record? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
