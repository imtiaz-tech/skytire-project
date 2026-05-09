'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, Scaling } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTireSizes, deleteTireSize } from '@/redux/slices/tireSizesSlice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import TireSizePreviewModal from '@/components/admin/TireSizePreviewModal';
import Link from 'next/link';
import { TireSize } from '@/redux/types/tireSizeTypes';

export default function TireSizesPage() {
  const dispatch = useAppDispatch();
  const { tireSizes, loading, total, pages, currentPage } = useAppSelector((state) => state.tireSizes);
  
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const limit = 10;

  // Modal State - Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<string | null>(null);

  // Modal State - Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState<TireSize | null>(null);

  useEffect(() => {
    dispatch(fetchTireSizes({ page, limit, search }));
  }, [dispatch, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openDeleteModal = (id: string) => {
    setSizeToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openPreview = (size: TireSize) => {
    setPreviewSize(size);
    setIsPreviewOpen(true);
  };

  const confirmDelete = async () => {
    if (sizeToDelete) {
      await dispatch(deleteTireSize(sizeToDelete));
      setIsDeleteModalOpen(false);
      setSizeToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Scaling className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Tire Sizes</h1>
        </div>
        <Link
          href="/admin/tire-sizes/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add New Size
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search sizes or models..."
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

          <div className="ml-auto text-[15px] font-bold text-gray-700 whitespace-nowrap">
            Total Sizes: <span className="text-[#1e2a4a]">({total})</span>
          </div>
        </div>
      </div>

      {/* Sizes Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Tire Size</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Model</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Vehicle Type</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Status</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Fetching sizes...</p>
                    </div>
                  </td>
                </tr>
              ) : tireSizes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="h-6 w-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-semibold">No tire sizes found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tireSizes.map((size) => (
                  <tr key={size.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="text-[15px] font-bold text-[#1e2a4a] cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openPreview(size)}
                        title="Click to preview"
                      >
                        {size.tireSize}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="text-[15px] font-medium text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openPreview(size)}
                        title="Click to preview"
                      >
                        {size.model?.modelName || 'Unknown Model'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="text-[15px] font-bold text-[#1e2a4a] cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => openPreview(size)}
                        title="Click to preview"
                      >
                        {size.model?.brand?.brandName || 'Unknown Brand'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="text-[14px] font-semibold text-gray-600 cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => openPreview(size)}
                        title="Click to preview"
                      >
                        {size.vehicleType || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 text-[12px] font-bold uppercase tracking-wider rounded-full ${
                        size.status === 'active' 
                          ? 'bg-green-50 text-green-600 border border-green-100' 
                          : 'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {size.status || 'active'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/tire-sizes/edit/${size.id}`}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(size.id)}
                          className="w-10 h-10 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && tireSizes.length > 0 && (
          <div className="px-8 py-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
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
        )}
      </div>

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Tire Size"
        message="Are you sure you want to delete this tire size? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <TireSizePreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        size={previewSize}
      />
    </div>
  );
}
