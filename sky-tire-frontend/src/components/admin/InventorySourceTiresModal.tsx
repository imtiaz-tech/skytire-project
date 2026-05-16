'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Package, Search } from 'lucide-react';
import axios from 'axios';
import Pagination from '@/components/ui/Pagination';
import { Tire } from '@/redux/types/tireTypes';
import { InventorySource } from '@/redux/types/inventorySourceTypes';

interface InventorySourceTiresModalProps {
  open: boolean;
  onClose: () => void;
  source: InventorySource | null;
}

export default function InventorySourceTiresModal({ open, onClose, source }: InventorySourceTiresModalProps) {
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const limit = 5;

  useEffect(() => {
    if (open && source) {
      fetchTires();
    }
  }, [open, source, page]);

  const fetchTires = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/admin/inventory-sources/${source?.id}/tires?page=${page}&limit=${limit}`);
      setTires(response.data.tires);
      setTotal(response.data.total);
      setPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching tires:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !source) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#1e2a4a]">Linked Tires</h2>
              <p className="text-[16px] text-gray-400 font-medium">Inventory Source: <span className="text-[#1e2a4a] font-bold">{source.source}</span></p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-10 w-10 text-[#1e2a4a] animate-spin" />
              <p className="text-gray-400 font-medium italic">Loading linked tires...</p>
            </div>
          ) : tires.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold text-lg">No tires linked to this source</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="overflow-x-auto border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[14px] font-bold text-gray-400 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-4 text-[14px] font-bold text-gray-400 uppercase tracking-wider">Tire Size</th>
                      <th className="px-6 py-4 text-[14px] font-bold text-gray-400 uppercase tracking-wider">Brand / Model</th>
                      <th className="px-6 py-4 text-[14px] font-bold text-gray-400 uppercase tracking-wider">Cost</th>
                      <th className="px-6 py-4 text-[14px] font-bold text-gray-400 uppercase tracking-wider">Sale</th>
                      <th className="px-6 py-4 text-[14px] font-bold text-gray-400 uppercase tracking-wider text-center">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tires.map((tire) => (
                      <tr key={tire.id} className="hover:bg-gray-50/30 transition-all">
                        <td className="px-6 py-4 text-[14px] font-bold text-[#1e2a4a] whitespace-nowrap">{tire.sku}</td>
                        <td className="px-6 py-4 text-[14px] font-medium text-[#1e2a4a] whitespace-nowrap">{tire.tireSize}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-bold text-[#1e2a4a]">{tire.model?.brand?.brandName}</span>
                            <span className="text-[14px] text-[#1e2a4a] font-medium">{tire.model?.modelName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[14px] font-bold text-blue-600 whitespace-nowrap">${tire.cost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-[14px] font-bold text-green-600 whitespace-nowrap">${tire.salePrice.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-3 py-1 rounded-full text-[14px] font-bold ${tire.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {tire.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Modal Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-sm font-medium text-gray-400 italic">
                    Showing <span className="text-[#1e2a4a] font-bold">{tires.length}</span> of {total} tires
                  </span>
                  <Pagination 
                    currentPage={page}
                    totalPages={pages}
                    onPageChange={(p) => setPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f8f9fa;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
