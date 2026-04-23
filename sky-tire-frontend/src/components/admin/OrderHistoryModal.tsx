'use client';

import React from 'react';
import { X, History as HistoryIcon } from 'lucide-react';
import { User } from '@/redux/types/userTypes';

interface OrderHistoryModalProps {
  user: User;
  onClose: () => void;
}

export default function OrderHistoryModal({ user, onClose }: OrderHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#1e2a4a]">
          <div>
            <h2 className="text-xl font-bold text-white">Member History</h2>
            <p className="text-blue-200 text-sm">{user.name} ({user.memberId})</p>
          </div>
          <button 
            onClick={onClose}
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
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-200 text-[#1e2a4a] rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
