'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBrands, deleteBrand } from '@/redux/slices/brandsSlice';
import { Brand, BrandCategory } from '@/redux/types/brandTypes';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';

const categories: { label: string; value: BrandCategory }[] = [
  { label: 'Tires', value: 'tire' },
  { label: 'Wheels', value: 'wheel' },
  { label: 'Wire Wheel', value: 'wire_wheel' },
  { label: 'Accessory', value: 'accessory' },
  { label: 'Bolt On Wheels', value: 'bolt_on_wheels' },
];

export default function BrandsPage() {
  const dispatch = useAppDispatch();
  const { brands, loading, total, pages, currentPage } = useAppSelector((state) => state.brands);
  
  const [activeTab, setActiveTab] = useState<BrandCategory>('tire');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  useEffect(() => {
    dispatch(fetchBrands({ page, limit, category: activeTab, search }));
  }, [dispatch, page, search, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (val: BrandCategory) => {
    setActiveTab(val);
    setPage(1);
    setSearchInput('');
    setSearch('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      dispatch(deleteBrand(id));
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    return baseUrl.replace('/api', '') + '/' + path;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-15">
        <h1 className="text-2xl font-bold text-[#1e2a4a]">Brands</h1>
        <Link
          href="/admin/brands/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          New Brand
        </Link>
      </div>

      {/* Filter & Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Search Row */}
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder={`Search ${categories.find(c => c.value === activeTab)?.label} Brands ...`}
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

          {/* Categories Tabs */}
          <div className="flex items-center gap-8 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleTabChange(cat.value)}
                className={`relative py-2 text-[15px] font-bold transition-all whitespace-nowrap ${
                  activeTab === cat.value 
                    ? 'text-[#1e2a4a]' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {cat.label}
                {activeTab === cat.value && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#1e2a4a] rounded-full animate-in fade-in slide-in-from-left-2 duration-200" />
                )}
              </button>
            ))}
          </div>

          {/* Total Count */}
          <div className="ml-auto text-[15px] font-bold text-gray-700 whitespace-nowrap">
            Total: <span className="text-[#1e2a4a]">({total})</span>
          </div>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in duration-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-8 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.1em]">Brand <span className="ml-1 text-[10px] opacity-60">↑</span></th>
                <th className="px-8 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.1em] text-center">Featured</th>
                <th className="px-8 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#3B5998] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Fetching brands...</p>
                    </div>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                        <Search className="h-6 w-6 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-semibold">No brands found</p>
                      <p className="text-gray-300 text-xs">Try searching for something else or add a new brand.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-14 bg-white rounded-xl p-1.5 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm group-hover:border-blue-100 group-hover:shadow-md transition-all">
                          <img src={getImageUrl(brand.brandLogo)} alt={brand.brandName} className="max-w-full max-h-full object-contain" />
                        </div>
                        <span className="text-[16px] font-bold text-[#1e2a4a] tracking-tight">{brand.brandName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center whitespace-nowrap">
                      {brand.isFeatured ? (
                        <div className="inline-flex items-center justify-center gap-1.5 text-orange-500 font-bold text-[13px] px-3 py-1 bg-orange-50 rounded-full">
                          <Star className="h-3.5 w-3.5 fill-orange-500" />
                          <span>Featured</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 font-bold text-[13px]">Standard</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="px-5 py-2.5 bg-[#FF5A5F] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-red-100"
                        >
                          Delete
                        </button>
                        <Link
                          href={`/admin/brands/edit/${brand.id}`}
                          className="px-5 py-2.5 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-100"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && brands.length > 0 && (
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
    </div>
  );
}
