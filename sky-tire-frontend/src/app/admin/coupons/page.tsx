'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, Edit2, Trash2, Ticket } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCoupons, deleteCoupon } from '@/features/coupons/slice';
import { formatAppliesToLabels } from '@/constants/couponOptions';
import { Coupon } from '@/redux/types/couponTypes';
import Pagination from '@/components/ui/Pagination';
import ConfirmModal from '@/components/common/ConfirmModal';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const dispatch = useAppDispatch();
  const { coupons, loading, total, pages, currentPage } = useAppSelector((state) => state.coupons);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const limit = 10;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCoupons({ page, limit, search }));
  }, [dispatch, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const confirmDelete = async () => {
    if (couponToDelete) {
      try {
        await dispatch(deleteCoupon(couponToDelete)).unwrap();
        toast.success('Coupon deleted successfully');
        dispatch(fetchCoupons({ page, limit, search }));
      } catch (error: unknown) {
        toast.error(typeof error === 'string' ? error : 'Failed to delete coupon');
      } finally {
        setIsDeleteModalOpen(false);
        setCouponToDelete(null);
      }
    }
  };

  const formatDiscount = (type: string, value: number) =>
    type === 'percentage' ? `${value}%` : `$${value.toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Ticket className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Coupons</h1>
        </div>
        <Link
          href="/admin/coupons/add"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add Coupon
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <form onSubmit={handleSearch} className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
              <input
                type="text"
                placeholder="Search by code or title..."
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
            Total Coupons: <span className="text-[#1e2a4a]">({total})</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                  Applies To
                </th>
                <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-semibold">No coupons found</p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon: Coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4 font-bold text-[#1e2a4a]">{coupon.code}</td>
                    <td className="px-6 py-4 text-gray-600">{coupon.title}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatDiscount(coupon.discountType, coupon.discountValue)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm max-w-xs">
                      {formatAppliesToLabels(coupon.appliesTo)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          coupon.status === 'active'
                            ? 'bg-green-50 text-green-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {coupon.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/admin/coupons/edit/${coupon.id}`}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setCouponToDelete(coupon.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-10 h-10 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all"
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

        {!loading && coupons.length > 0 && (
          <div className="px-8 py-8 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-400">
              Page <span className="text-[#1e2a4a] font-bold">{currentPage}</span> of{' '}
              <span className="text-[#1e2a4a] font-bold">{pages}</span>
            </div>
            <Pagination currentPage={page} totalPages={pages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
