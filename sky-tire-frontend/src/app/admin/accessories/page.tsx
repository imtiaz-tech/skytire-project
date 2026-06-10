'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, Plus, Edit2, Trash2, Copy, ArrowUp, ArrowDown, ArrowUpDown, Eye, EyeOff, Wrench,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAccessories, deleteAccessory, bulkUpdateAccessories } from '@/features/accessories/slice';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import AccessoryPreviewModal from '@/components/admin/AccessoryPreviewModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Accessory } from '@/redux/types/accessoryTypes';
import toast from 'react-hot-toast';

type TabType = 'PUBLISHED' | 'DRAFT' | 'VISIBLE' | 'INVISIBLE';

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function AccessoriesPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessories, loading, total, pages, currentPage } = useAppSelector((state) => state.accessories);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('PUBLISHED');
  const [sortBy, setSortBy] = useState('sku');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accessoryToDelete, setAccessoryToDelete] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);

  const isBulkTab = activeTab === 'VISIBLE' || activeTab === 'INVISIBLE';

  const buildParams = useCallback(() => {
    const params: Record<string, unknown> = { page, limit, search, sortBy, sortOrder };
    if (activeTab === 'PUBLISHED') params.status = 'published';
    else if (activeTab === 'DRAFT') params.status = 'draft';
    else if (activeTab === 'VISIBLE') params.isVisible = true;
    else if (activeTab === 'INVISIBLE') params.isVisible = false;
    return params;
  }, [page, limit, search, activeTab, sortBy, sortOrder]);

  useEffect(() => {
    dispatch(fetchAccessories(buildParams() as Parameters<typeof fetchAccessories>[0]));
  }, [dispatch, buildParams]);

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
    if (sortBy === column) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(column); setSortOrder('asc'); }
    setPage(1);
  };

  const openDeleteModal = (id: string) => {
    setAccessoryToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDuplicate = (id: string) => {
    sessionStorage.setItem('duplicateAccessoryId', id);
    router.push('/admin/accessories/add');
  };

  const openPreview = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setIsPreviewOpen(true);
  };

  const confirmDelete = async () => {
    if (accessoryToDelete) {
      try {
        await dispatch(deleteAccessory(accessoryToDelete)).unwrap();
        toast.success('Accessory deleted successfully');
      } catch (error: unknown) {
        const err = error as { message?: string };
        toast.error(err.message || 'Failed to delete accessory');
      } finally {
        setIsDeleteModalOpen(false);
        setAccessoryToDelete(null);
      }
    }
  };

  const allChecked = accessories.length > 0 && accessories.every((a) => selectedIds.has(a.id));
  const someChecked = accessories.some((a) => selectedIds.has(a.id)) && !allChecked;

  const toggleSelectAll = () => {
    setSelectedIds(allChecked ? new Set() : new Set(accessories.map((a) => a.id)));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    const targetIsVisible = activeTab === 'INVISIBLE';
    setBulkLoading(true);
    try {
      await dispatch(bulkUpdateAccessories({ ids: Array.from(selectedIds), isVisible: targetIsVisible })).unwrap();
      toast.success(`${selectedIds.size} accessor${selectedIds.size > 1 ? 'ies' : 'y'} marked as ${targetIsVisible ? 'Visible' : 'Invisible'}`);
      setSelectedIds(new Set());
      dispatch(fetchAccessories(buildParams() as Parameters<typeof fetchAccessories>[0]));
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortBy === col) return sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
    return <ArrowUpDown className="h-3 w-3 text-gray-200" />;
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'PUBLISHED', label: 'Published' },
    { id: 'DRAFT', label: 'Drafts' },
    { id: 'VISIBLE', label: 'Visible' },
    { id: 'INVISIBLE', label: 'Invisible' },
  ];

  const searchPlaceholder =
    activeTab === 'DRAFT' ? 'Search drafts by name, SKU, brand...'
    : activeTab === 'VISIBLE' ? 'Search visible by name, SKU, brand...'
    : activeTab === 'INVISIBLE' ? 'Search invisible by name, SKU, brand...'
    : 'Search by name, SKU, brand, category...';

  const bulkButtonLabel = activeTab === 'VISIBLE' ? 'Make Invisible' : 'Make Visible';
  const bulkButtonIcon = activeTab === 'VISIBLE' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Wrench className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Accessories List</h1>
        </div>
        <Link href="/admin/accessories/add" className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" />
          Add Accessory
        </Link>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-3">
            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input type="text" placeholder={searchPlaceholder} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-[16px] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all font-medium" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            <button type="submit" className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#2a3a5a] transition-all shadow-md shadow-blue-50">Search</button>
          </form>

          <div className="flex items-center gap-8 flex-1">
            <div className="h-10 w-px bg-gray-100 hidden md:block ml-2" />
            <div className="flex items-center gap-8">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`py-2 text-[15px] font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-[#1e2a4a]' : 'text-gray-400 hover:text-gray-600'}`}>
                  {tab.label}
                  {activeTab === tab.id && <div className="absolute bottom-[-20px] left-0 right-0 h-[3px] bg-[#1e2a4a] rounded-full" />}
                </button>
              ))}
            </div>
            <div className="ml-auto text-[15px] font-bold text-gray-700 whitespace-nowrap">
              Total Accessories: <span className="text-[#1e2a4a]">({total})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                {isBulkTab && (
                  <th className="px-6 py-5 w-12">
                    <input type="checkbox" checked={allChecked} ref={(el) => { if (el) el.indeterminate = someChecked; }} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] cursor-pointer accent-[#1e2a4a]" />
                  </th>
                )}
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('productName')}>
                  <div className="flex items-center gap-2">Name <SortIcon col="productName" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('sku')}>
                  <div className="flex items-center gap-2">SKU <SortIcon col="sku" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-2">Category <SortIcon col="category" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand</th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em]">Source</th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('cost')}>
                  <div className="flex items-center gap-2">Cost <SortIcon col="cost" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('mapPrice')}>
                  <div className="flex items-center gap-2">MAP Price <SortIcon col="mapPrice" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('salePrice')}>
                  <div className="flex items-center gap-2">Sale <SortIcon col="salePrice" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('regularPrice')}>
                  <div className="flex items-center gap-2">Regular <SortIcon col="regularPrice" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] cursor-pointer hover:text-[#1e2a4a]" onClick={() => handleSort('stock')}>
                  <div className="flex items-center gap-2">Stock <SortIcon col="stock" /></div>
                </th>
                <th className="px-6 py-5 text-[14px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={isBulkTab ? 13 : 12} className="px-8 py-20 text-center">
                    <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : accessories.length === 0 ? (
                <tr>
                  <td colSpan={isBulkTab ? 13 : 12} className="px-8 py-20 text-center text-gray-400 font-semibold">No accessories found</td>
                </tr>
              ) : (
                accessories.map((item) => {
                  const firstImage = item.images?.length > 0 ? getImageUrl(item.images[0]) : null;
                  const isChecked = selectedIds.has(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-gray-50/50 transition-all ${isBulkTab && isChecked ? 'bg-blue-50/40' : ''}`}>
                      {isBulkTab && (
                        <td className="px-6 py-4">
                          <input type="checkbox" checked={isChecked} onChange={() => toggleSelectOne(item.id)} className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a] cursor-pointer accent-[#1e2a4a]" />
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <button onClick={() => openPreview(item)} className="flex items-center gap-3 text-left hover:opacity-80">
                          <div className="w-11 h-11 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0 flex items-center justify-center">
                            {firstImage ? <img src={firstImage} alt="" className="w-full h-full object-cover" /> : <Wrench className="h-5 w-5 text-gray-200" />}
                          </div>
                          <span className="text-[14px] font-bold text-[#1e2a4a] max-w-[300px] truncate">{item.productName}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => openPreview(item)} className="text-[14px] font-bold text-[#1e2a4a] hover:text-blue-600">{item.sku}</button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-gray-600">{item.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => openPreview(item)}
                          className="text-[14px] font-bold text-gray-600 hover:text-blue-600 transition-colors underline-offset-2"
                        >
                          {item.brand?.brandName || <span className="text-gray-300 italic font-normal">—</span>}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-gray-500">{item.source?.source || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-[#1e2a4a]">${item.cost.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-gray-600">
                        {item.mapPrice > 0 ? `$${item.mapPrice.toFixed(2)}` : <span className="text-gray-300 italic font-normal">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-green-600">${item.salePrice.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-[14px] font-bold text-[#1e2a4a]">
                        {item.regularPrice != null && item.regularPrice > 0 ? `$${item.regularPrice.toFixed(2)}` : <span className="text-gray-300 italic font-normal">—</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-[14px] font-bold ${item.stock <= 0 ? 'text-red-500' : 'text-[#1e2a4a]'}`}>{item.stock}</span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                           onClick={() => handleDuplicate(item.id)} 
                           className="w-9 h-9 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all" title="Duplicate"><Copy className="h-4 w-4" /></button>
                          <Link href={`/admin/accessories/edit/${item.id}`} className="w-9 h-9 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all" title="Edit"><Edit2 className="h-4 w-4" /></Link>
                          <button
                           onClick={() => openDeleteModal(item.id)}
                           className="w-9 h-9 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && accessories.length > 0 && (
          <div className="px-8 py-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            {isBulkTab ? (
              <button onClick={handleBulkAction} disabled={selectedIds.size === 0 || bulkLoading} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedIds.size === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : activeTab === 'VISIBLE' ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'}`}>
                {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : bulkButtonIcon}
                {bulkButtonLabel}
                {selectedIds.size > 0 && <span className="ml-1 bg-white/30 rounded-full px-1.5 py-0.5 text-xs">{selectedIds.size}</span>}
              </button>
            ) : <div />}

            <div className="flex items-center gap-6">
              <div className="text-sm font-medium text-gray-400">
                Page <span className="text-[#1e2a4a] font-bold">{currentPage}</span> of <span className="text-[#1e2a4a] font-bold">{pages}</span>
              </div>
              <Pagination currentPage={page} totalPages={pages} onPageChange={(p) => setPage(p)} />
            </div>
          </div>
        )}
      </div>

      <ConfirmModal open={isDeleteModalOpen} title="Delete Accessory" message="Are you sure you want to delete this accessory? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setIsDeleteModalOpen(false)} />
      <AccessoryPreviewModal open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} accessory={selectedAccessory} />
    </div>
  );
}
