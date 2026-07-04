'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Scale, ArrowUp, ArrowDown } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchPriceMatchQueries,
  fetchPriceMatchQueryById,
  clearSelectedQuery,
  markPriceMatchQueryRead,
  fetchUnreadPriceMatchCount,
} from '@/features/price-match-queries/slice';
import { PriceMatchQuery } from '@/redux/types/priceMatchQueryTypes';
import Pagination from '@/components/ui/Pagination';
import PriceMatchQueryDetailModal from '@/components/admin/PriceMatchQueryDetailModal';
import { getUploadImageUrl } from '@/lib/uploadImageUrl';
import { roundCurrency } from '@/utils/pricing';
import toast from 'react-hot-toast';

type SortField = 'productName' | 'brandName' | 'salePrice' | 'fullName' | 'competitor' | 'createdAt';

export default function PriceMatchQueriesPage() {
  const dispatch = useAppDispatch();
  const { queries, loading, total, pages, currentPage, selectedQuery, detailLoading, unreadCount } =
    useAppSelector((state) => state.priceMatchQueries);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('productName');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const limit = 10;

  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchUnreadPriceMatchCount());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchPriceMatchQueries({ page, limit, search, sortBy, sortOrder }));
  }, [dispatch, page, search, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const handleView = async (query: PriceMatchQuery) => {
    setIsDetailOpen(true);
    try {
      await dispatch(markPriceMatchQueryRead(query.id)).unwrap();
      await dispatch(fetchPriceMatchQueryById(query.id)).unwrap();
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to load query details');
      setIsDetailOpen(false);
    }
  };

  const getRowTextClass = (isRead: boolean) =>
    isRead ? 'text-gray-400 font-medium' : 'text-black font-semibold';

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    dispatch(clearSelectedQuery());
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 inline ml-1" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 inline ml-1" />
    );
  };

  const thClass =
    'px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap';
  const sortableThClass = `${thClass} cursor-pointer select-none hover:text-gray-600`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Scale className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Price Match Queries</h1>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search..."
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

          <div className="ml-auto flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 text-[15px] font-bold text-gray-700 whitespace-nowrap">
            <span>
              Total Queries: <span className="text-[#1e2a4a]">{total}</span>
            </span>
            <span>
              Unread Queries: <span className="text-red-500">{unreadCount}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th
                  className={sortableThClass}
                  onClick={() => handleSort('productName')}
                >
                  Product Name
                  <SortIcon field="productName" />
                </th>
                <th
                  className={sortableThClass}
                  onClick={() => handleSort('brandName')}
                >
                  Brand
                  <SortIcon field="brandName" />
                </th>
                <th
                  className={`${sortableThClass} text-right`}
                  onClick={() => handleSort('salePrice')}
                >
                  Sale Price
                  <SortIcon field="salePrice" />
                </th>
                <th
                  className={sortableThClass}
                  onClick={() => handleSort('competitor')}
                >
                  Competitor
                  <SortIcon field="competitor" />
                </th>
                <th className={thClass}>Competitor Price</th>
                <th
                  className={sortableThClass}
                  onClick={() => handleSort('fullName')}
                >
                  Full Name
                  <SortIcon field="fullName" />
                </th>
                <th className={`${thClass} text-center`}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1e2a4a] mx-auto" />
                  </td>
                </tr>
              ) : queries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400 font-medium">
                    No price match queries found.
                  </td>
                </tr>
              ) : (
                queries.map((query) => {
                  const thumb = query.product?.images?.[0];
                  const rowTextClass = getRowTextClass(query.isRead ?? false);
                  return (
                    <tr key={query.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 max-w-md">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
                            {thumb ? (
                              <img
                                src={getUploadImageUrl(thumb)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                          <span className={`text-[14px] line-clamp-2 ${rowTextClass}`}>
                            {query.product?.productName ?? 'Unknown product'}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 text-[14px] ${rowTextClass}`}>
                        {query.product?.brandName ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {query.product ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-red-50 text-red-600 text-sm font-bold">
                            $ {roundCurrency(query.product.salePrice).toFixed(2)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`px-6 py-4 text-[14px] ${rowTextClass}`}>
                        {query.competitor}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-bold">
                          $ {query.competitorPrice}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-[14px] ${rowTextClass}`}>
                        {query.fullName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleView(query)}
                          className="bg-[#1e2a4a] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-opacity-90 transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && queries.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 border-t border-gray-50">
            <p className="text-sm text-gray-500 font-medium">
              Page {currentPage} of {pages}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={pages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <PriceMatchQueryDetailModal
        open={isDetailOpen}
        onClose={handleCloseDetail}
        query={selectedQuery}
        loading={detailLoading}
      />
    </div>
  );
}
