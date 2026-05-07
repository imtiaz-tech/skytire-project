'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, Tags, Image as ImageIcon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchTireModels, deleteTireModel } from '@/redux/slices/tireModelsSlice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import TireModelPreviewModal from '@/components/admin/TireModelPreviewModal';
import Link from 'next/link';
import { TireModel } from '@/redux/types/tireModelTypes';

export default function TireModelsPage() {
  const dispatch = useAppDispatch();
  const { tireModels, loading, total, pages, currentPage } = useAppSelector((state) => state.tireModels);
  
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const limit = 10;

  // Modal State - Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<string | null>(null);

  // Modal State - Preview
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewModel, setPreviewModel] = useState<TireModel | null>(null);

  useEffect(() => {
    dispatch(fetchTireModels({ page, limit, search }));
  }, [dispatch, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const openDeleteModal = (id: string) => {
    setModelToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const openPreview = (model: TireModel) => {
    setPreviewModel(model);
    setIsPreviewOpen(true);
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const confirmDelete = async () => {
    if (modelToDelete) {
      await dispatch(deleteTireModel(modelToDelete));
      setIsDeleteModalOpen(false);
      setModelToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Tags className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Tire Models</h1>
        </div>
        <Link
          href="/admin/tire-models/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add New Model
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
                placeholder="Search models or brands..."
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
            Total Models: <span className="text-[#1e2a4a]">({total})</span>
          </div>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Image</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Model Name</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Season / Performance</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Vehicle Type</th>
                <th className="px-8 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Fetching models...</p>
                    </div>
                  </td>
                </tr>
              ) : tireModels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="h-6 w-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-semibold">No tire models found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tireModels.map((model) => (
                  <tr key={model.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                        onClick={() => openPreview(model)}
                        title="Click to preview"
                      >
                        {model.images && model.images.length > 0 ? (
                          <img 
                            src={getImageUrl(model.images[0])} 
                            alt={model.modelName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => openPreview(model)}
                        title="Click to preview"
                      >
                        <div className="text-[15px] font-bold text-[#1e2a4a]">
                          {model.brand?.brandName || 'Unknown Brand'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="text-[15px] font-medium text-gray-700 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openPreview(model)}
                        title="Click to preview"
                      >
                        {model.modelName}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="flex flex-col cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={() => openPreview(model)}
                        title="Click to preview"
                      >
                        <span className="text-[14px] font-semibold text-gray-600">{model.season || 'N/A'}</span>
                        <span className="text-[14px] text-gray-400">{model.performance || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div 
                        className="text-[14px] font-medium text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openPreview(model)}
                        title="Click to preview"
                      >
                        {model.vehicleType || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/tire-models/edit/${model.id}`}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(model.id)}
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
        {!loading && tireModels.length > 0 && (
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
        title="Delete Tire Model"
        message="Are you sure you want to delete this tire model? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <TireModelPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        model={previewModel}
      />
    </div>
  );
}
