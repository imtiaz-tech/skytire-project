'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBrands, deleteBrand } from '@/redux/slices/brandsSlice';
import { Brand } from '@/redux/types/brandTypes';
import Pagination from '@/components/ui/Pagination';
import Link from 'next/link';

export default function BrandsPage() {
  const dispatch = useAppDispatch();
  const { brands, loading, total, pages, currentPage } = useAppSelector((state) => state.brands);
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const limit = 10;

  useEffect(() => {
    dispatch(fetchBrands({ page, limit, search }));
  }, [dispatch, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this brand?')) {
      dispatch(deleteBrand(id));
    }
  };

  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
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

      {/* Search Area */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search brands..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#3B5998] transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="bg-[#1e2a4a] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-all flex-shrink-0"
          >
            Search
          </button>
        </form>
        <div className="text-base text-black-500 font-bold">
          Total: <span className="text-[#1e2a4a] font-bold">({total})</span>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Brand Logo</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Brand Name</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Category</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">Featured</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#3B5998] animate-spin" />
                      <p className="text-gray-400 text-sm font-medium">Loading brands...</p>
                    </div>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-400 font-medium">No brands found.</p>
                  </td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-20 h-12 bg-gray-50 rounded-lg p-1 flex items-center justify-center overflow-hidden border border-gray-100">
                        <img src={getImageUrl(brand.brandLogo)} alt={brand.brandName} className="max-w-full max-h-full object-contain" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-[15.5px] font-bold text-[#1e2a4a]">{brand.brandName}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-blue-50 text-[#3B5998] text-[11px] font-bold uppercase rounded-full tracking-wider">
                        {formatCategory(brand.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {brand.isFeatured ? (
                        <div className="flex items-center justify-center gap-1.5 text-orange-500 font-bold text-[13px]">
                          <Star className="h-4 w-4 fill-orange-500" />
                          <span>Yes</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 font-bold text-[13px]">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/brands/edit/${brand.id}`}
                          className="p-2 bg-[#1e2a4a] text-white rounded-lg hover:bg-opacity-90 transition-all shadow-md shadow-blue-50"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(brand.id)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-opacity-90 transition-all shadow-md shadow-red-50"
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

        {/* Pagination */}
        {!loading && brands.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-500">
              Showing page <span className="text-[#1e2a4a] font-bold">{currentPage}</span> of{' '}
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
