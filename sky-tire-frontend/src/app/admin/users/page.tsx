'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUsers, toggleUserStatus, toggleDeviceBan } from '@/redux/slices/usersSlice';
import { User } from '@/redux/types/userTypes';
import Pagination from '@/components/ui/Pagination';
import DeviceHistoryModal from '@/components/admin/DeviceHistoryModal';
import OrderHistoryModal from '@/components/admin/OrderHistoryModal';

const UsersPage = () => {
  const dispatch = useAppDispatch();
  const { users, loading, total, pages: totalPages } = useAppSelector((state) => state.users);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeviceHistoryModal, setShowDeviceHistoryModal] = useState(false);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
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

  const handleToggleDeviceBan = (user: User) => {
    // If currently all banned → unban; otherwise ban all
    dispatch(toggleDeviceBan({ id: user.id, ban: !user.allDevicesBanned }));
  };

  const openDeviceHistory = (user: User) => {
    setSelectedUser(user);
    setShowDeviceHistoryModal(true);
  };

  const closeDeviceHistory = () => {
    setShowDeviceHistoryModal(false);
    setSelectedUser(null);
  };

  const openOrderHistory = (user: User) => {
    setSelectedUser(user);
    setShowOrderHistoryModal(true);
  };

  const closeOrderHistory = () => {
    setShowOrderHistoryModal(false);
    setSelectedUser(null);
  };

  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '--';
    const cleaned = phone.replace(/\D/g, '');
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
        <div className="text-base text-black-500 font-bold">
          Total: <span className="text-[#1e2a4a] font-bold">({total})</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Member ID</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">History</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">Role</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">Active</th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                  Device Ban
                </th>
                <th className="px-6 py-4 text-[13px] font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                  Devices
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 text-[#3B5998] animate-spin" />
                      <p className="text-gray-400 text-sm">Loading members...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center whitespace-nowrap">
                    <p className="text-gray-400 font-medium">No members found matching your search.</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base font-bold text-[#1e2a4a]">{user.name}</span>
                    </td>

                    {/* Member ID */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base text-gray-600 font-medium">{user.memberId}</span>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base text-gray-600">{user.email}</span>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="text-base text-gray-600">{formatPhoneNumber(user.phone)}</span>
                    </td>

                    {/* Order History */}
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => openOrderHistory(user)}
                        className="bg-[#1e2a4a] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-opacity-90 transition-all uppercase"
                      >
                        History
                      </button>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        user.role === 'ADMIN'
                          ? 'bg-red-50 text-red-500'
                          : 'bg-green-50 text-green-500'
                      }`}>
                        {user.role === 'ADMIN' ? 'Admin' : 'User'}
                      </span>
                    </td>

                    {/* Active Toggle */}
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        title={user.isActive ? 'Deactivate user' : 'Activate user'}
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

                    {/* Device Ban Toggle */}
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleDeviceBan(user)}
                        title={
                          user.allDevicesBanned
                            ? 'Unban all devices'
                            : user.deviceCount === 0
                            ? 'No devices registered'
                            : 'Ban all devices'
                        }
                        disabled={user.deviceCount === 0}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                          user.allDevicesBanned ? 'bg-red-500' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            user.allDevicesBanned ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Device History Button */}
                    <td className="px-6 py-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => openDeviceHistory(user)}
                        className="bg-[#1e2a4a] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-opacity-90 transition-all uppercase"
                      >
                        History
                        {(user.deviceCount ?? 0) > 0 && (
                          <span className="ml-1.5 bg-blue-400/30 text-blue-100 text-[10px] px-1.5 py-0.5 rounded-full">
                            {user.deviceCount}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
            <div className="text-sm font-medium text-gray-500">
              Showing page <span className="text-[#1e2a4a] font-bold">{page}</span> of{' '}
              <span className="text-[#1e2a4a] font-bold">{totalPages}</span>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* Device History Modal */}
      {showDeviceHistoryModal && selectedUser && (
        <DeviceHistoryModal user={selectedUser} onClose={closeDeviceHistory} />
      )}

      {/* Order History Modal */}
      {showOrderHistoryModal && selectedUser && (
        <OrderHistoryModal user={selectedUser} onClose={closeOrderHistory} />
      )}
    </div>
  );
};

export default UsersPage;
