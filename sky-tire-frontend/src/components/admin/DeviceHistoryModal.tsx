'use client';

import React, { useEffect } from 'react';
import { X, Loader2, Monitor, ShieldBan, ShieldCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchUserDevices, clearDevices } from '@/redux/slices/usersSlice';
import { User } from '@/redux/types/userTypes';

interface DeviceHistoryModalProps {
  user: User;
  onClose: () => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateId(id: string): string {
  if (id.length <= 20) return id;
  return `${id.slice(0, 10)}…${id.slice(-8)}`;
}

export default function DeviceHistoryModal({ user, onClose }: DeviceHistoryModalProps) {
  const dispatch = useAppDispatch();
  const { devicesByUserId, deviceLoading } = useAppSelector((s) => s.users);
  const devices = devicesByUserId[user.id] ?? null;

  useEffect(() => {
    dispatch(fetchUserDevices(user.id));
    return () => {
      dispatch(clearDevices(user.id));
    };
  }, [dispatch, user.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#1e2a4a]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-300" />
              Device History
            </h2>
            <p className="text-blue-200 text-sm mt-0.5">
              {user.name} &nbsp;·&nbsp; Member #{user.memberId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-white transition-all"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {deviceLoading || devices === null ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 text-[#3B5998] animate-spin" />
              <p className="text-gray-400 text-sm">Loading device history…</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center">
                <Monitor className="h-7 w-7 text-[#3B5998]" />
              </div>
              <p className="text-gray-500 font-medium">No devices registered yet</p>
              <p className="text-gray-400 text-sm text-center max-w-xs">
                Devices will appear here after the user logs in with Fingerprint enabled.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse text-sm min-w-max">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider rounded-tl-xl whitespace-nowrap">
                      Visitor ID
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Browser
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      OS / Device
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      IP & Location
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Flags (VPN/Proxy/Bot)
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      First Seen
                    </th>
                    <th className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider rounded-tr-xl whitespace-nowrap">
                      Last Seen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <code
                          className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-lg"
                          title={device.visitorId}
                        >
                          {truncateId(device.visitorId)}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        {device.isBanned ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-500 text-[11px] font-bold uppercase tracking-wider">
                            <ShieldBan className="h-3.5 w-3.5" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-500 text-[11px] font-bold uppercase tracking-wider">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                        {device.browserName || 'Unknown'} {device.browserVersion ? `(${device.browserVersion})` : ''}
                        {device.incognito && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-200 text-gray-600 uppercase">
                            Incognito
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                        {device.os || 'Unknown'} / {device.device || 'Desktop'}
                      </td>
                      <td className="px-4 py-4 text-gray-600 text-xs whitespace-nowrap">
                        <div className="font-medium">{device.ipAddress || '—'}</div>
                        <div className="text-gray-400 text-[10px]">
                          {device.city && device.country ? `${device.city}, ${device.country}` : 'Location Unknown'}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${device.vpnDetected ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            VPN
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${device.proxyDetected ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            Proxy
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${device.botDetected ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                            Bot
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(device.firstSeenAt || device.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(device.lastSeenAt || device.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {devices !== null ? `${devices.length} device${devices.length !== 1 ? 's' : ''} registered` : ''}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-[#1e2a4a] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
