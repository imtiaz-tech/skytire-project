'use client';

import React from 'react';
import { X, Pencil, Package, DollarSign, Calculator } from 'lucide-react';
import Link from 'next/link';
import { Wheel } from '@/redux/types/wheelTypes';

interface WheelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  wheel: Wheel | null;
}

export default function WheelPreviewModal({ open, onClose, wheel }: WheelPreviewModalProps) {
  if (!open || !wheel) return null;

  const InfoRow = ({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-50 last:border-0">
      <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider w-48 shrink-0 mb-1 sm:mb-0">
        {label}
      </span>
      <div className={`text-[16px] font-medium flex-1 ${color || 'text-[#1e2a4a]'}`}>
        {value !== undefined && value !== null && value !== '' ? value : <span className="text-gray-300 italic">Not specified</span>}
      </div>
    </div>
  );

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
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Wheel Details Preview</h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/wheels/edit/${wheel.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit Wheel
            </Link>
            <button 
              onClick={onClose}
              className="p-2.5 bg-[#1e2a4a] text-white rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-blue-900/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Header Info */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                    {wheel.brand?.brandName || 'Unknown Brand'}
                  </span>
                  {wheel.brandVariant && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      {wheel.brandVariant}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                    SKU: {wheel.sku}
                  </span>
                </div>
                <h1 className="text-[36px] sm:text-[42px] font-black text-[#1e2a4a] leading-tight tracking-tight">
                  {wheel.productName || 'Wheel Name'}
                </h1>
              </div>
              <div className="bg-green-50 px-8 py-6 rounded-[32px] border border-green-100 text-center min-w-[200px]">
                <div className="text-sm font-bold text-green-600 uppercase tracking-wider mb-1">Sale Price</div>
                <div className="text-[32px] font-black text-green-600 leading-none">
                  ${wheel.salePrice.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Technical Specifications Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Technical Specifications</h3>
              </div>
              <div className="px-8 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <InfoRow label="Wheel Size" value={wheel.wheelSize} />
                  <InfoRow label="Offset" value={wheel.offset} />
                  <InfoRow label="Bolt Pattern" value={wheel.boltPatternMM ? `${wheel.boltPatternInches} (${wheel.boltPatternMM}mm)` : wheel.boltPatternInches} />
                  <InfoRow label="Lug Count" value={wheel.lugCount} />
                  <InfoRow label="Load Rating" value={wheel.loadRatingLbs ? `${wheel.loadRatingLbs} lbs (${wheel.loadRatingKg} kg)` : wheel.loadRatingKg} />
                  <InfoRow label="Finish" value={wheel.finish} />
                  <InfoRow label="Style" value={wheel.style} />
                  <InfoRow label="Backspacing" value={wheel.backspacing} />
                  <InfoRow label="Weight" value={wheel.weight ? `${wheel.weight} lbs` : null} />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Pricing Details</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="Regular Price" value={`$${wheel.regularPrice.toFixed(2)}`} />
                <InfoRow label="Unit Cost" value={`$${wheel.cost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="MAP Price" value={`$${wheel.mapPrice.toFixed(2)}`} />
              </div>
            </div>

            {/* Inventory Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Inventory & Logistics</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="SKU" value={<span className="font-bold">{wheel.sku}</span>} />
                <InfoRow label="Alternate Part #" value={wheel.alternatePartNumber} />
                <InfoRow label="UPC No" value={wheel.upcNo} />
                <InfoRow label="Stock Level" value={<span className="font-bold">{wheel.stock} units</span>} />
                <InfoRow label="Inventory Sources" value={
                  <div className="flex flex-wrap gap-2">
                    {wheel.sources && wheel.sources.length > 0 ? wheel.sources.map(s => (
                      <span key={s.id} className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[13px] font-bold rounded-full">
                        {s.source}
                      </span>
                    )) : <span className="text-gray-300 italic">No sources assigned</span>}
                  </div>
                } />
              </div>
            </div>

            {/* Features & Marketing Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Marketing & Content</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="Keywords" value={
                  <div className="flex flex-wrap gap-2">
                    {wheel.keywords ? wheel.keywords.split(';').filter(Boolean).map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-bold rounded-full">
                        {kw}
                      </span>
                    )) : <span className="text-gray-300 italic">No keywords</span>}
                  </div>
                } />
                <InfoRow label="SEO Title" value={wheel.seoTitle} />
                <div className="flex flex-col py-4">
                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meta Description</span>
                  <p className="text-[15px] text-[#1e2a4a] leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {wheel.metaDescription || <span className="text-gray-300 italic">No description provided</span>}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}
