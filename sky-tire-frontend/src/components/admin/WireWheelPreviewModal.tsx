'use client';

import React, { useMemo } from 'react';
import { X, Pencil, Package, DollarSign, Calculator, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import { WireWheel } from '@/redux/types/wireWheelTypes';
import { calculateTireNetCostPricing } from '@/utils/pricing';
import { getYouTubeEmbedUrl } from '@/lib/youtube';

interface WireWheelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  wireWheel: WireWheel | null;
}

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function WireWheelPreviewModal({ open, onClose, wireWheel }: WireWheelPreviewModalProps) {
  const pricing = useMemo(() => {
    if (!wireWheel) return null;
    return calculateTireNetCostPricing(
      wireWheel.cost,
      wireWheel.internalShipping ?? 0,
      wireWheel.processingCharges ?? 0,
      wireWheel.margin ?? 0
    );
  }, [wireWheel]);

  if (!open || !wireWheel) return null;

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
            {wireWheel.brand?.brandName && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {wireWheel.brand.brandName}
              </span>
            )}
            {wireWheel.size && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {wireWheel.size}
              </span>
            )}
            {wireWheel.spoke && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide uppercase">
                {wireWheel.spoke} Spokes
              </span>
            )}
            {wireWheel.finish && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide uppercase">
                {wireWheel.finish}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2.5">
            {wireWheel.sku && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {wireWheel.sku}
              </span>
            )}
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${wireWheel.status?.toLowerCase() === 'published' ? 'bg-[#1e78ff] text-white' : 'bg-orange-500 text-white'}`}>
              {wireWheel.status ? wireWheel.status.charAt(0).toUpperCase() + wireWheel.status.slice(1).toLowerCase() : 'Draft'}
            </span>
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${wireWheel.isActive ? 'bg-[#00a86b] text-white' : 'bg-gray-400 text-white'}`}>
              {wireWheel.isActive ? 'Visible' : 'Hidden'}
            </span>

            <div className="flex items-center gap-2 ml-2">
              <Link
                href={`/admin/wire-wheels/edit/${wireWheel.id}`}
                className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </Link>

              <Link
                href={`/wire-wheel/${wireWheel.slug}`}
                target="_blank"
                className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm animate-pulse"
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
                  {wireWheel.images && wireWheel.images.length > 0 ? (
                    wireWheel.images.slice(0, 2).map((img, idx) => {
                      const imageUrl = getImageUrl(img);
                      return (
                        <div key={idx} className="flex-1 rounded-xl overflow-hidden flex items-center justify-center h-[200px]">
                          <img src={imageUrl || ''} alt={`${wireWheel.name} ${idx}`} className="w-full h-full object-contain mix-blend-multiply" />
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
                      {wireWheel.brand?.brandName || 'Unknown Brand'}
                    </span>
                    {wireWheel.finish && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                        {wireWheel.finish}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      SKU: {wireWheel.sku}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <h1 className="text-[28px] sm:text-[32px] font-black text-[#1e2a4a] leading-tight tracking-tight flex-1">
                      {wireWheel.name || 'Wire Wheel Name'}
                    </h1>
                    
                    <div className="bg-green-50/80 px-6 py-4 rounded-[24px] text-center min-w-[140px] shrink-0 border border-green-100">
                      <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">Sale Price</div>
                      <div className="text-[26px] font-black text-green-600 leading-none">
                        ${wireWheel.salePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-gray-50 pt-6">
                  <div>
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Pricing</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[24px] font-black text-[#1e2a4a] leading-none">
                        ${wireWheel.salePrice.toFixed(2)}
                      </span>
                      {wireWheel.regularPrice > wireWheel.salePrice && (
                        <span className="text-[16px] font-medium text-gray-400 line-through">
                          ${wireWheel.regularPrice.toFixed(2)}
                        </span>
                      )}
                      {wireWheel.mapPrice > 0 && (
                        <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-full text-[12px] font-bold">
                          MAP ${wireWheel.mapPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stock</div>
                    <div className="text-[20px] font-bold text-[#1e2a4a] leading-none">
                      {wireWheel.stock}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Videos — uploaded video first, then YouTube embed */}
            {(wireWheel.video || wireWheel.youtubeUrl) && (
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">Product Videos</h3>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {wireWheel.video && (
                    <div className="w-full rounded-2xl overflow-hidden bg-black">
                      <video
                        src={getImageUrl(wireWheel.video) || undefined}
                        controls
                        className="w-full max-h-[420px]"
                      />
                    </div>
                  )}
                  {wireWheel.youtubeUrl && getYouTubeEmbedUrl(wireWheel.youtubeUrl) && (
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black">
                      <iframe
                        src={getYouTubeEmbedUrl(wireWheel.youtubeUrl) || undefined}
                        title={`${wireWheel.name} YouTube video`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
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
                  <InfoRow label="Size" value={wireWheel.size} />
                  <InfoRow label="Offset" value={wireWheel.offset} />
                  <InfoRow label="Bolt Pattern" value={wireWheel.boltPattern} />
                  <InfoRow label="Backspacing" value={wireWheel.backSpacing ? `${wireWheel.backSpacing} inches` : null} />
                  <InfoRow label="Spoke Count" value={wireWheel.spoke} />
                  <InfoRow label="Spoke Style" value={wireWheel.spokeStyle} />
                  <InfoRow label="Finish" value={wireWheel.finish} />
                  <InfoRow label="Country of Origin" value={wireWheel.countryOfOrigin} />
                  <InfoRow label="Wire Wheel Weight" value={wireWheel.wireWheelWeight ? `${wireWheel.wireWheelWeight} lbs` : null} />
                  <InfoRow label="Shipping Dimensions" value={wireWheel.shippingDimensions} />
                  <InfoRow label="Options Description" value={wireWheel.options} />
                  <InfoRow label="Accessories" value={wireWheel.accessories} />
                </div>
              </div>
            </div>

            {/* Caps & KnockOffs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Floating Caps */}
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2 sticky top-0 z-10">
                  <Package className="h-5 w-5 text-blue-500" />
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">Floating Caps</h3>
                </div>
                <div className="px-8 py-6 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                  {Array.isArray(wireWheel.floatingCaps) && wireWheel.floatingCaps.length > 0 ? (
                    wireWheel.floatingCaps.map((cap: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl shrink-0">
                        {cap.image ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0">
                            <img src={getImageUrl(cap.image) || ''} alt="Cap" className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 font-bold text-xs">Cap</div>
                        )}
                        <div>
                          <div className="text-base font-bold text-[#1e2a4a]">{cap.name}</div>
                          <div className="text-sm font-black text-green-600">${parseFloat(cap.price || 0).toFixed(2)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm italic text-center py-4">No floating caps configured</p>
                  )}
                </div>
              </div>

              {/* Knockoffs & Chips */}
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2 sticky top-0 z-10">
                  <Package className="h-5 w-5 text-purple-500" />
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">KnockOffs & Chips</h3>
                </div>
                <div className="px-8 py-6 flex-1 space-y-6 overflow-y-auto custom-scrollbar">
                  {Array.isArray(wireWheel.knockOffs) && wireWheel.knockOffs.length > 0 ? (
                    wireWheel.knockOffs.map((ko: any, kIdx: number) => (
                      <div key={kIdx} className="space-y-4 pb-6 border-b border-gray-100 last:border-0 last:pb-0 shrink-0">
                        <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                          {ko.image ? (
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center shrink-0">
                              <img src={getImageUrl(ko.image) || ''} alt="Knockoff" className="w-full h-full object-contain mix-blend-multiply" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 font-bold text-xs">Knock</div>
                          )}
                          <div>
                            <div className="text-base font-bold text-[#1e2a4a]">{ko.name}</div>
                            <div className="text-sm font-black text-green-600">${parseFloat(ko.price || 0).toFixed(2)}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">Chip Option: <span className="font-bold uppercase">{ko.chipOption || 'No'}</span></div>
                          </div>
                        </div>

                        {ko.chips && ko.chips.length > 0 && (
                          <div className="pl-4">
                            <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Available Chips</div>
                            <div className="grid grid-cols-2 gap-2">
                              {ko.chips.map((chip: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                                  {chip.image ? (
                                    <img src={getImageUrl(chip.image) || ''} alt="Chip" className="w-8 h-8 object-contain bg-white rounded border shrink-0 mix-blend-multiply" />
                                  ) : (
                                    <div className="w-8 h-8 rounded bg-gray-100 shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-400">Chip</div>
                                  )}
                                  <span className="text-xs font-semibold text-[#1e2a4a] truncate" title={chip.name}>{chip.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm italic text-center py-4">No knockoffs configured</p>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Ratings Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Sky Wire Wheel Scores</h3>
              </div>
              <div className="px-8 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{wireWheel.platingDepthScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Plating Depth</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{wireWheel.sealingIntegrityScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Sealing Integrity</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{wireWheel.spokeTensionScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Spoke Tension</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{wireWheel.feedbackScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Feedback Score</div>
                  </div>
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
                <InfoRow label="Regular Price" value={`$${wireWheel.regularPrice.toFixed(2)}`} />
                <InfoRow label="Sale Price" value={`$${wireWheel.salePrice.toFixed(2)}`} color="text-green-600 font-bold" />
                <InfoRow label="Unit Cost" value={`$${wireWheel.cost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="Internal Shipping" value={`$${(wireWheel.internalShipping ?? 0).toFixed(2)}`} />
                <InfoRow label="Processing Charges" value={`${wireWheel.processingCharges ?? 0}%`} />
                <InfoRow label="Margin" value={`${wireWheel.margin ?? 0}%`} />
                <InfoRow label="Processing Amount" value={`$${pricing?.processingAmount.toFixed(2)}`} />
                <InfoRow label="Net Cost" value={`$${pricing?.netCost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="Margin Amount" value={`$${pricing?.marginAmount.toFixed(2)}`} />
                <InfoRow label="Minimum Sale Price" value={`$${pricing?.minimumSalePrice.toFixed(2)}`} color="text-green-600 font-bold" />
                <InfoRow label="MAP Price" value={`$${wireWheel.mapPrice.toFixed(2)}`} />
                <InfoRow label="Shipping Cost" value={`$${wireWheel.shippingCost.toFixed(2)}`} />
                <InfoRow label="Handling Fee" value={`$${wireWheel.handlingFee.toFixed(2)}`} />
              </div>
            </div>

            {/* Inventory Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Inventory & Logistics</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="SKU" value={<span className="font-bold">{wireWheel.sku}</span>} />
                <InfoRow label="Package Include" value={wireWheel.packageInclude} />
                <InfoRow label="KnockOff Option" value={wireWheel.knockOffOption} />
                <InfoRow label="Stock Level" value={<span className="font-bold">{wireWheel.stock} units</span>} />
                <InfoRow label="Inventory Source" value={
                  wireWheel.source?.source ? (
                    <span className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[13px] font-bold rounded-full">
                      {wireWheel.source.source}
                    </span>
                  ) : <span className="text-gray-300 italic">No source assigned</span>
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
                    {wireWheel.keywords ? wireWheel.keywords.split(';').filter(Boolean).map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-bold rounded-full">
                        {kw}
                      </span>
                    )) : <span className="text-gray-300 italic">No keywords</span>}
                  </div>
                } />
                <InfoRow label="SEO Title" value={wireWheel.seoTitle} />
                <div className="flex flex-col py-4">
                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meta Description</span>
                  <p className="text-[15px] text-[#1e2a4a] leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {wireWheel.metaDescription || <span className="text-gray-300 italic">No description provided</span>}
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
