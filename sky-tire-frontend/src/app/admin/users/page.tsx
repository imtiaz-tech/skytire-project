'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, History as HistoryIcon, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUsers, toggleUserStatus } from '@/redux/slices/usersSlice';
import { User } from '@/redux/types/userTypes';
import Pagination from '@/components/ui/Pagination';


const UsersPage = () => {
  const dispatch = useAppDispatch();
  const { users, loading, total, pages: totalPages } = useAppSelector((state) => state.users);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const limit = 10;

  useEffect(() => {
    dispatch(fetchUsers({ page, limit, search }));
  }, [dispatch, page, search]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleToggleStatus = (user: User) => {
    dispatch(toggleUserStatus({ id: user.id, isActive: !user.isActive }));
  };


  const openHistory = (user: User) => {
    setSelectedUser(user);
    setShowHistoryModal(true);
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '--';
    const cleaned = phone.replace(/\D/g, '');
    // If it's a 10-digit number, format it as +92-XXX-XXXXXXX
    if (cleaned.length === 10) {
      return `+92-${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mt-15">
        <h1 className="text-2xl font-bold text-[#1e2a4a]">Members</h1>
      </div>

      {/* Filters/Search Area */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or member ID"
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
        <div className="text-base  text-black-500 font-bold">
          Total: <span className="text-[#1e2a4a] font-bold">({total})</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Member ID</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center">History</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center">Role</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#3B5998] animate-spin" />
                      <p className="text-gray-400 text-sm">Loading members...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <p className="text-gray-400 font-medium">No members found matching your search.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <span className="text-base font-bold text-[#1e2a4a]">{user.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-base text-gray-600 font-medium">{user.memberId}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-base text-gray-600">{user.email}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base text-gray-600">{formatPhoneNumber(user.phone)}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => openHistory(user)}
                        className="bg-[#1e2a4a] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-opacity-90 transition-all uppercase"
                      >
                        History
                      </button>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-50 text-red-500' 
                          : 'bg-green-50 text-green-500'
                      }`}>
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}

                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          user.isActive ? 'bg-[#00b087]' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            user.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {!loading && users.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-500">
              Showing page <span className="text-[#1e2a4a] font-bold">{page}</span> of <span className="text-[#1e2a4a] font-bold">{totalPages}</span>
            </div>
            <Pagination 
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>


      {/* History Modal Placeholder */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowHistoryModal(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#1e2a4a]">
              <div>
                <h2 className="text-xl font-bold text-white">Member History</h2>
                <p className="text-blue-200 text-sm">{selectedUser.name} ({selectedUser.memberId})</p>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl text-white transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                  <HistoryIcon className="h-8 w-8 text-[#3B5998]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1e2a4a]">History is Coming Soon</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
                    We are currently building the order and interaction history module for members.
                  </p>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-2.5 bg-white border border-gray-200 text-[#1e2a4a] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
