'use client';

import React, { useMemo } from 'react';
import { X, Pencil, Package, DollarSign, Calculator, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Wheel } from '@/redux/types/wheelTypes';
import PreviewSourceInventoryBlock from '@/components/admin/PreviewSourceInventoryBlock';
import { calculateTireNetCostPricing } from '@/utils/pricing';

interface WheelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  wheel: Wheel | null;
}
const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function WheelPreviewModal({ open, onClose, wheel }: WheelPreviewModalProps) {
  const pricing = useMemo(() => {
    if (!wheel) return null;
    return calculateTireNetCostPricing(
      wheel.cost,
      wheel.internalShipping ?? 0,
      wheel.processingCharges ?? 0,
      wheel.margin ?? 0
    );
  }, [wheel]);

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
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 flex-wrap">
            {wheel.brand?.brandName && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {wheel.brand.brandName}
              </span>
            )}
            {wheel.wheelSize && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {wheel.wheelSize}
              </span>
            )}
            {wheel.style && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide uppercase">
                {wheel.style}
              </span>
            )}
            {wheel.finish && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide uppercase">
                {wheel.finish}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2.5">
            {wheel.sku && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {wheel.sku}
              </span>
            )}
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${wheel.status?.toLowerCase() === 'published' ? 'bg-[#1e78ff] text-white' : 'bg-orange-500 text-white'}`}>
              {wheel.status ? wheel.status.charAt(0).toUpperCase() + wheel.status.slice(1).toLowerCase() : 'Draft'}
            </span>
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${wheel.isActive ? 'bg-[#00a86b] text-white' : 'bg-gray-400 text-white'}`}>
              {wheel.isActive ? 'Visible' : 'Hidden'}
            </span>

            <div className="flex items-center gap-2 ml-2">
              <Link
                href={`/admin/wheels/edit/${wheel.id}`}
                className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </Link>

              <Link
                href={`/wheel/${wheel.slug}`}
                target="_blank"
                className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>

              <button 
                onClick={onClose}
                className="p-1.5 px-3 bg-[#1e1e1e] border border-[#1e1e1e] text-white rounded-lg hover:bg-black transition-all shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* Main Info with Images */}
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Images Left Side */}
              <div className="w-full lg:w-[45%]">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-center gap-4 h-full min-h-[250px] shadow-sm">
                  {wheel.images && wheel.images.length > 0 ? (
                    wheel.images.slice(0, 2).map((img, idx) => {
                      const imageUrl = getImageUrl(img);
                      return (
                        <div key={idx} className="flex-1 rounded-xl overflow-hidden flex items-center justify-center h-[200px]">
                          <img src={imageUrl || ''} alt={`${wheel.productName} ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 font-medium text-sm">No images available</div>
                  )}
                </div>
              </div>

              {/* Product Info Right Side */}
              <div className="w-full lg:w-[55%] flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      {wheel.brand?.brandName || 'Unknown Brand'}
                    </span>
                    {wheel.finish ? (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                        {wheel.finish}
                      </span>
                    ) : wheel.style ? (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                        {wheel.style}
                      </span>
                    ) : null}
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      SKU: {wheel.sku}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <h1 className="text-[28px] sm:text-[32px] font-black text-[#1e2a4a] leading-tight tracking-tight flex-1">
                      {wheel.productName || 'Wheel Name'}
                    </h1>
                    
                    <div className="bg-green-50/80 px-6 py-4 rounded-[24px] text-center min-w-[140px] shrink-0 border border-green-100">
                      <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">Sale Price</div>
                      <div className="text-[26px] font-black text-green-600 leading-none">
                        ${wheel.salePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-gray-50 pt-6">
                  <div>
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Pricing</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[24px] font-black text-[#1e2a4a] leading-none">
                        ${wheel.salePrice.toFixed(2)}
                      </span>
                      {wheel.regularPrice > wheel.salePrice && (
                        <span className="text-[16px] font-medium text-gray-400 line-through">
                          ${wheel.regularPrice.toFixed(2)}
                        </span>
                      )}
                      {wheel.mapPrice > 0 && (
                        <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-full text-[12px] font-bold">
                          MAP ${wheel.mapPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stock</div>
                    <div className="text-[20px] font-bold text-[#1e2a4a] leading-none">
                      {wheel.stock}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Videos */}
            {(wheel.video || wheel.youtubeUrl) && (
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">Product Videos</h3>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {wheel.video && (
                    <div className="w-full rounded-2xl overflow-hidden bg-black">
                      <video
                        src={getImageUrl(wheel.video) || undefined}
                        controls
                        className="w-full max-h-[420px]"
                      />
                    </div>
                  )}
                  {wheel.youtubeUrl && (
                    <div className="space-y-2">
                      <h4 className="text-[14px] font-bold text-gray-400 uppercase tracking-wider">YouTube Video</h4>
                      <a
                        href={wheel.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[15px] font-medium text-blue-600 hover:text-blue-700 underline break-all"
                      >
                        {wheel.youtubeUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                  <InfoRow label="Backspacing" value={wheel.backSpacing} />
                  <InfoRow label="Weight" value={wheel.shippingWeight ? `${wheel.shippingWeight} lbs` : null} />
                  <InfoRow label="Shipping Dimensions" value={wheel.shippingDimensions} />
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
                <InfoRow label="MAP Price" value={`$${wheel.mapPrice.toFixed(2)}`} />
                <InfoRow label="Unit Cost" value={`$${wheel.cost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="Internal Shipping" value={`$${(wheel.internalShipping ?? 0).toFixed(2)}`} />
                <InfoRow label="Processing Charges" value={`${wheel.processingCharges ?? 0}%`} />
                <InfoRow label="Margin" value={`${wheel.margin ?? 0}%`} />
                <InfoRow label="Processing Amount" value={`$${pricing?.processingAmount.toFixed(2)}`} />
                <InfoRow label="Margin Amount" value={`$${pricing?.marginAmount.toFixed(2)}`} />
                <InfoRow label="Net Cost" value={`$${pricing?.netCost.toFixed(2)}`} color="text-red-600 font-bold" />
                <InfoRow label="Minimum Sale Price" value={`$${pricing?.minimumSalePrice.toFixed(2)}`} color="text-green-600 font-bold" />
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
              <div className="px-8 pb-6">
                <PreviewSourceInventoryBlock
                  productId={wheel.id}
                  productKind="wheel"
                  mapPrice={wheel.mapPrice}
                  mapPriceHistory={(wheel as any).mapPriceHistory}
                  sourceInventories={(wheel as any).sourceInventories}
                />
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
