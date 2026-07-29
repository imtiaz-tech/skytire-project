'use client';

import React, { useMemo } from 'react';
import { X, Pencil, Package, DollarSign, Calculator, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import { BoltOnWireWheel } from '@/redux/types/boltOnWireWheelTypes';
import PreviewSourceInventoryBlock from '@/components/admin/PreviewSourceInventoryBlock';
import PreviewImageGallery from '@/components/admin/PreviewImageGallery';
import { calculateTireNetCostPricing } from '@/utils/pricing';

interface BoltOnWireWheelPreviewModalProps {
  open: boolean;
  onClose: () => void;
  boltOnWireWheel: BoltOnWireWheel | null;
  zClassName?: string;
}

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function BoltOnWireWheelPreviewModal({
  open,
  onClose,
  boltOnWireWheel,
  zClassName = 'z-[100]',
}: BoltOnWireWheelPreviewModalProps) {
  const pricing = useMemo(() => {
    if (!boltOnWireWheel) return null;
    return calculateTireNetCostPricing(
      boltOnWireWheel.cost,
      boltOnWireWheel.internalShipping ?? 0,
      boltOnWireWheel.processingCharges ?? 0,
      boltOnWireWheel.margin ?? 0
    );
  }, [boltOnWireWheel]);

  if (!open || !boltOnWireWheel) return null;

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
    <div className={`fixed inset-0 ${zClassName} flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]`}>
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
            {boltOnWireWheel.brand?.brandName && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {boltOnWireWheel.brand.brandName}
              </span>
            )}
            {boltOnWireWheel.size && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {boltOnWireWheel.size}
              </span>
            )}
            {boltOnWireWheel.spoke && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide uppercase">
                {boltOnWireWheel.spoke} Spokes
              </span>
            )}
            {boltOnWireWheel.finish && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide uppercase">
                {boltOnWireWheel.finish}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2.5">
            {boltOnWireWheel.sku && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {boltOnWireWheel.sku}
              </span>
            )}
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${boltOnWireWheel.status?.toLowerCase() === 'published' ? 'bg-[#1e78ff] text-white' : 'bg-orange-500 text-white'}`}>
              {boltOnWireWheel.status ? boltOnWireWheel.status.charAt(0).toUpperCase() + boltOnWireWheel.status.slice(1).toLowerCase() : 'Draft'}
            </span>
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${boltOnWireWheel.isActive ? 'bg-[#00a86b] text-white' : 'bg-gray-400 text-white'}`}>
              {boltOnWireWheel.isActive ? 'Visible' : 'Hidden'}
            </span>

            <div className="flex items-center gap-2 ml-2">
              <Link
                href={`/admin/bolt-on-wire-wheels/edit/${boltOnWireWheel.id}`}
                className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </Link>

              <Link
                href={`/bolt-on-wire-wheel/${boltOnWireWheel.slug}`}
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
                <PreviewImageGallery
                  images={boltOnWireWheel.images || []}
                  alt={boltOnWireWheel.name}
                  getImageUrl={getImageUrl}
                />
              </div>

              {/* Product Info Right Side */}
              <div className="w-full lg:w-[55%] flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      {boltOnWireWheel.brand?.brandName || 'Unknown Brand'}
                    </span>
                    {boltOnWireWheel.finish && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                        {boltOnWireWheel.finish}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      SKU: {boltOnWireWheel.sku}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <h1 className="text-[28px] sm:text-[32px] font-black text-[#1e2a4a] leading-tight tracking-tight flex-1">
                      {boltOnWireWheel.name || 'Bolt-On Wire Wheel Name'}
                    </h1>
                    
                    <div className="bg-green-50/80 px-6 py-4 rounded-[24px] text-center min-w-[140px] shrink-0 border border-green-100">
                      <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">Sale Price</div>
                      <div className="text-[26px] font-black text-green-600 leading-none">
                        ${boltOnWireWheel.salePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-gray-50 pt-6">
                  <div>
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Pricing</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[24px] font-black text-[#1e2a4a] leading-none">
                        ${boltOnWireWheel.salePrice.toFixed(2)}
                      </span>
                      {boltOnWireWheel.regularPrice > boltOnWireWheel.salePrice && (
                        <span className="text-[16px] font-medium text-gray-400 line-through">
                          ${boltOnWireWheel.regularPrice.toFixed(2)}
                        </span>
                      )}
                      {boltOnWireWheel.mapPrice > 0 && (
                        <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-full text-[12px] font-bold">
                          MAP ${boltOnWireWheel.mapPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stock</div>
                    <div className="text-[20px] font-bold text-[#1e2a4a] leading-none">
                      {boltOnWireWheel.stock}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Videos */}
            {(boltOnWireWheel.video || boltOnWireWheel.youtubeUrl) && (
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50">
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">Product Videos</h3>
                </div>
                <div className="px-8 py-6 space-y-6">
                  {boltOnWireWheel.video && (
                    <div className="w-full rounded-2xl overflow-hidden bg-black">
                      <video
                        src={getImageUrl(boltOnWireWheel.video) || undefined}
                        controls
                        className="w-full max-h-[420px]"
                      />
                    </div>
                  )}
                  {boltOnWireWheel.youtubeUrl && (
                    <div className="space-y-2">
                      <h4 className="text-[14px] font-bold text-gray-400 uppercase tracking-wider">YouTube Video</h4>
                      <a
                        href={boltOnWireWheel.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[15px] font-medium text-blue-600 hover:text-blue-700 underline break-all"
                      >
                        {boltOnWireWheel.youtubeUrl}
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
                  <InfoRow label="Size" value={boltOnWireWheel.size} />
                  <InfoRow label="Offset" value={boltOnWireWheel.offset} />
                  <InfoRow label="Bolt Pattern" value={boltOnWireWheel.boltPattern} />
                  <InfoRow label="Backspacing" value={boltOnWireWheel.backSpacing ? `${boltOnWireWheel.backSpacing} inches` : null} />
                  <InfoRow label="Spoke Count" value={boltOnWireWheel.spoke} />
                  <InfoRow label="Spoke Style" value={boltOnWireWheel.spokeStyle} />
                  <InfoRow label="Finish" value={boltOnWireWheel.finish} />
                  <InfoRow label="Country of Origin" value={boltOnWireWheel.countryOfOrigin} />
                  <InfoRow label="Wire Wheel Weight" value={boltOnWireWheel.wireWheelWeight ? `${boltOnWireWheel.wireWheelWeight} lbs` : null} />
                  <InfoRow label="Shipping Dimensions" value={boltOnWireWheel.shippingDimensions} />
                  <InfoRow label="Options Description" value={boltOnWireWheel.options} />
                  <InfoRow label="Accessories" value={boltOnWireWheel.accessories} />
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
                  {Array.isArray(boltOnWireWheel.floatingCaps) && boltOnWireWheel.floatingCaps.length > 0 ? (
                    boltOnWireWheel.floatingCaps.map((cap: any, idx: number) => (
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
                  {Array.isArray(boltOnWireWheel.knockOffs) && boltOnWireWheel.knockOffs.length > 0 ? (
                    boltOnWireWheel.knockOffs.map((ko: any, kIdx: number) => (
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
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Sky Bolt-On Wire Wheel Scores</h3>
              </div>
              <div className="px-8 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{boltOnWireWheel.platingDepthScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Plating Depth</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{boltOnWireWheel.sealingIntegrityScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Sealing Integrity</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{boltOnWireWheel.spokeTensionScore}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Spoke Tension</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{boltOnWireWheel.feedbackScore}/10</div>
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
                <InfoRow label="Regular Price" value={`$${boltOnWireWheel.regularPrice.toFixed(2)}`} />
                <InfoRow label="Sale Price" value={`$${boltOnWireWheel.salePrice.toFixed(2)}`} color="text-green-600 font-bold" />
                <InfoRow label="Unit Cost" value={`$${boltOnWireWheel.cost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="Internal Shipping" value={`$${(boltOnWireWheel.internalShipping ?? 0).toFixed(2)}`} />
                <InfoRow label="Processing Charges" value={`${boltOnWireWheel.processingCharges ?? 0}%`} />
                <InfoRow label="Margin" value={`${boltOnWireWheel.margin ?? 0}%`} />
                <InfoRow label="Processing Amount" value={`$${pricing?.processingAmount.toFixed(2)}`} />
                <InfoRow label="Net Cost" value={`$${pricing?.netCost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="Margin Amount" value={`$${pricing?.marginAmount.toFixed(2)}`} />
                <InfoRow label="Minimum Sale Price" value={`$${pricing?.minimumSalePrice.toFixed(2)}`} color="text-green-600 font-bold" />
                <InfoRow label="MAP Price" value={`$${boltOnWireWheel.mapPrice.toFixed(2)}`} />
                <InfoRow label="Shipping Cost" value={`$${boltOnWireWheel.shippingCost.toFixed(2)}`} />
                <InfoRow label="Handling Fee" value={`$${boltOnWireWheel.handlingFee.toFixed(2)}`} />
              </div>
            </div>

            {/* Inventory Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Inventory & Logistics</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="SKU" value={<span className="font-bold">{boltOnWireWheel.sku}</span>} />
                <InfoRow label="Alternate Part #" value={boltOnWireWheel.alternatePartNumber} />
                <InfoRow label="UPC No" value={boltOnWireWheel.upcNo} />
                <InfoRow label="Package Include" value={boltOnWireWheel.packageInclude} />
                <InfoRow label="KnockOff Option" value={boltOnWireWheel.knockOffOption} />
                <InfoRow label="Stock Level" value={<span className="font-bold">{boltOnWireWheel.stock} units</span>} />
                <InfoRow label="Inventory Source" value={
                  boltOnWireWheel.source?.source ? (
                    <span className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[13px] font-bold rounded-full">
                      {boltOnWireWheel.source.source}
                    </span>
                  ) : <span className="text-gray-300 italic">No source assigned</span>
                } />
              </div>
              <div className="px-8 pb-6">
                <PreviewSourceInventoryBlock
                  productId={boltOnWireWheel.id}
                  productKind="boltOnWheel"
                  mapPrice={boltOnWireWheel.mapPrice}
                  mapPriceHistory={(boltOnWireWheel as any).mapPriceHistory}
                  sourceInventories={(boltOnWireWheel as any).sourceInventories}
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
                    {boltOnWireWheel.keywords ? boltOnWireWheel.keywords.split(';').filter(Boolean).map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-bold rounded-full">
                        {kw}
                      </span>
                    )) : <span className="text-gray-300 italic">No keywords</span>}
                  </div>
                } />
                <InfoRow label="SEO Title" value={boltOnWireWheel.seoTitle} />
                <div className="flex flex-col py-4">
                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meta Description</span>
                  <p className="text-[15px] text-[#1e2a4a] leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {boltOnWireWheel.metaDescription || <span className="text-gray-300 italic">No description provided</span>}
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
