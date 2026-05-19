'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, CircleDot, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchWheels, deleteWheel } from '@/redux/slices/wheelsSlice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import WheelPreviewModal from '@/components/admin/WheelPreviewModal';
import Link from 'next/link';
import { Wheel } from '@/redux/types/wheelTypes';
import toast from 'react-hot-toast';

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function WheelsPage() {
  const dispatch = useAppDispatch();
  const { wheels, loading, total, pages, currentPage } = useAppSelector((state) => state.wheels);
  
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  // Modal State - Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [wheelToDelete, setWheelToDelete] = useState<string | null>(null);

  // Modal State - Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedWheel, setSelectedWheel] = useState<Wheel | null>(null);

  useEffect(() => {
    const params: any = { page, limit, search, sortBy, sortOrder };
    params.status = activeTab.toLowerCase();
    dispatch(fetchWheels(params));
  }, [dispatch, page, search, activeTab, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
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
    setWheelToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openPreview = (wheel: Wheel) => {
    setSelectedWheel(wheel);
    setIsPreviewOpen(true);
  };

  const confirmDelete = async () => {
    if (wheelToDelete) {
      try {
        await dispatch(deleteWheel(wheelToDelete)).unwrap();
        toast.success('Wheel deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete wheel');
      } finally {
        setIsDeleteModalOpen(false);
        setWheelToDelete(null);
      }
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy === col) {
      return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3 text-gray-200" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <CircleDot className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Wheels List</h1>
        </div>
        <Link
          href="/admin/wheels/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add New Wheel
        </Link>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder={activeTab === 'DRAFT' ? "Search Drafts..." : "Search Wheels..."}
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
              <button
                onClick={() => { setActiveTab('PUBLISHED'); setPage(1); }}
                className={`py-2 text-[15px] font-bold transition-all relative whitespace-nowrap ${activeTab === 'PUBLISHED' ? 'text-[#1e2a4a]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Published
                {activeTab === 'PUBLISHED' && <div className="absolute bottom-[-20px] left-0 right-0 h-[3px] bg-[#1e2a4a] rounded-full" />}
              </button>
              <button
                onClick={() => { setActiveTab('DRAFT'); setPage(1); }}
                className={`py-2 text-[15px] font-bold transition-all relative whitespace-nowrap ${activeTab === 'DRAFT' ? 'text-[#1e2a4a]' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Drafts
                {activeTab === 'DRAFT' && <div className="absolute bottom-[-20px] left-0 right-0 h-[3px] bg-[#1e2a4a] rounded-full" />}
              </button>
            </div>

            <div className="ml-auto text-[15px] font-bold text-gray-700 whitespace-nowrap">
              Total Wheels: <span className="text-[#1e2a4a]">({total})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                {/* Name + Image */}
                <th
                  className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a] transition-colors"
                  onClick={() => handleSort('productName')}
                >
                  <div className="flex items-center gap-2">
                    Name
                    <SortIcon col="productName" />
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
                  onClick={() => handleSort('wheelSize')}
                >
                  <div className="flex items-center gap-2">
                    Size
                    <SortIcon col="wheelSize" />
                  </div>
                </th>
                {/* UPC No */}
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">UPC No</th>
                {/* Alternate Part No */}
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Alt Part #</th>
                {/* Brand */}
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand</th>
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
                  <td colSpan={10} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Fetching wheels...</p>
                    </div>
                  </td>
                </tr>
              ) : wheels.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="h-6 w-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-semibold">No wheels found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                wheels.map((wheel) => {
                  const firstImage = wheel.images && wheel.images.length > 0 ? getImageUrl(wheel.images[0]) : null;
                  return (
                    <tr key={wheel.id} className="hover:bg-gray-50/50 transition-all group">
                      {/* Name + Image (clickable) */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="flex items-center gap-3 text-left group/name hover:opacity-80 transition-opacity"
                        >
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center">
                            {firstImage ? (
                              <img src={firstImage} alt={wheel.productName} className="w-full h-full object-cover" />
                            ) : (
                              <CircleDot className="h-5 w-5 text-gray-200" />
                            )}
                          </div>
                          <span className="text-[14px] font-bold text-[#1e2a4a] group-hover/name:text-blue-600 transition-colors max-w-[220px] line-clamp-2 leading-tight">
                            {wheel.productName}
                          </span>
                        </button>
                      </td>

                      {/* SKU (clickable) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-bold text-[#1e2a4a] hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
                        >
                          {wheel.sku}
                        </button>
                      </td>

                      {/* Size (clickable) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-bold text-gray-600 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
                        >
                          {wheel.wheelSize || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
                      </td>

                      {/* UPC No (clickable) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-medium text-gray-500 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
                        >
                          {wheel.upcNo || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
                      </td>

                      {/* Alternate Part No (clickable) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-medium text-gray-500 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
                        >
                          {wheel.alternatePartNumber || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
                      </td>

                      {/* Brand (clickable) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(wheel)}
                          className="text-[14px] font-bold text-gray-600 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
                        >
                          {wheel.brand?.brandName || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
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

                      {/* Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-[14px] font-bold ${wheel.stock <= 0 ? 'text-red-500' : 'text-[#1e2a4a]'}`}>
                          {wheel.stock}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/wheels/edit/${wheel.id}`}
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

        {!loading && wheels.length > 0 && (
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
        title="Delete Wheel"
        message="Are you sure you want to delete this wheel? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <WheelPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        wheel={selectedWheel}
      />
    </div>
  );
}
