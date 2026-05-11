'use client';

import React from 'react';
import { X, Pencil } from 'lucide-react';
import Link from 'next/link';
import { TireSize } from '@/redux/types/tireSizeTypes';

interface TireSizePreviewModalProps {
  open: boolean;
  onClose: () => void;
  size: TireSize | null;
}

export default function TireSizePreviewModal({ open, onClose, size }: TireSizePreviewModalProps) {
  if (!open || !size) return null;

  let parsedKeywords: string[] = [];
  if (size.keywords) {
    try {
      parsedKeywords = size.keywords.startsWith('[') 
        ? JSON.parse(size.keywords) 
        : size.keywords.split(',').map(k => k.trim()).filter(Boolean);
    } catch (e) {
      parsedKeywords = size.keywords.split(',').map(k => k.trim()).filter(Boolean);
    }
  }

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-50 last:border-0">
      <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider w-48 shrink-0 mb-1 sm:mb-0">
        {label}
      </span>
      <div className="text-[16px] font-medium text-[#1e2a4a] flex-1">
        {value || <span className="text-gray-300 italic">Not specified</span>}
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
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Tire Size Preview</h2>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/tire-sizes/edit/${size.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              Edit Size
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
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                  {size.model?.brand?.brandName || 'Unknown Brand'}
                </span>
                <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                  {size.model?.modelName || 'Unknown Model'}
                </span>
                <span className={`px-3 py-1 text-[13px] font-bold uppercase tracking-wider rounded-lg ${
                  size.status === 'ACTIVE' 
                    ? 'bg-green-50 text-green-600' 
                    : 'bg-red-50 text-red-600'
                }`}>
                  {size.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h1 className="text-[36px] sm:text-[42px] font-black text-[#1e2a4a] leading-tight tracking-tight">
                {size.tireSize}
              </h1>
            </div>

            {/* Size Specifications */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Size Specifications</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="Tire Size" value={size.tireSize} />
                <InfoRow label="Tire Width" value={size.tireWidth} />
                <InfoRow label="Aspect Ratio" value={size.aspectRatio} />
                <InfoRow label="Rim Diameter" value={size.rimDiameter} />
              </div>
            </div>

            {/* Performance Specifications */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Performance Details</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="Load Index" value={size.loadIndex} />
                <InfoRow label="Speed Rating" value={size.speedRating} />
                <InfoRow label="Load Range" value={size.loadRange} />
                <InfoRow label="Inflation Pressure" value={size.inflationPressure} />
                <InfoRow label="UTQG" value={size.utqg} />
                <InfoRow label="Vehicle Type" value={size.vehicleType?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} />
                <InfoRow label="Category" value={size.sidewallCategory?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} />
                <InfoRow label="Sidewall" value={size.sidewallDetail} />
              </div>
            </div>

            {/* Physical Specifications */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Physical Details</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="Tire Weight" value={size.tireWeight} />
                <InfoRow label="Shipping Dimensions" value={size.shippingDimensions} />
              </div>
            </div>

            {/* SEO Information */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">SEO Metadata</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="SEO Title" value={size.seoTitle} />
                <InfoRow label="Meta Description" value={size.metaDescription} />
                <InfoRow 
                  label="Keywords" 
                  value={
                    parsedKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {parsedKeywords.map((keyword, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[13px] font-bold rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : null
                  } 
                />
              </div>
            </div>

          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
