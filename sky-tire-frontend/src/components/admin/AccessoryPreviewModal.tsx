'use client';

import React from 'react';
import { X, Pencil, Package, DollarSign, Calculator, ExternalLink, Award } from 'lucide-react';
import Link from 'next/link';
import { Accessory } from '@/redux/types/accessoryTypes';
import { SPECIFICATION_FIELDS } from '@/constants/accessoryCategories';

interface AccessoryPreviewModalProps {
  open: boolean;
  onClose: () => void;
  accessory: Accessory | null;
}

const getImageUrl = (path: string) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
  const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
  return `${baseUrl}/uploads/${cleanPath}`;
};

export default function AccessoryPreviewModal({ open, onClose, accessory }: AccessoryPreviewModalProps) {
  if (!open || !accessory) return null;

  const specs = (accessory.specifications || {}) as Record<string, string>;

  const heroImages = (() => {
    const imgs: string[] = [];
    if (accessory.images?.length) {
      imgs.push(...accessory.images.slice(0, 2));
    } else {
      if (accessory.leftImage) imgs.push(accessory.leftImage);
      if (accessory.rightImage) imgs.push(accessory.rightImage);
    }
    return imgs;
  })();

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
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-5xl rounded-[32px] shadow-2xl shadow-blue-900/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2 flex-wrap">
            {accessory.brand?.brandName && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {accessory.brand.brandName}
              </span>
            )}
            {accessory.category && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {accessory.category}
              </span>
            )}
            {accessory.isFeatured && (
              <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-lg text-[13px] font-bold tracking-wide">
                Featured
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {accessory.sku && (
              <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[13px] font-bold tracking-wide">
                {accessory.sku}
              </span>
            )}
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${accessory.status?.toLowerCase() === 'published' ? 'bg-[#1e78ff] text-white' : 'bg-orange-500 text-white'}`}>
              {accessory.status ? accessory.status.charAt(0).toUpperCase() + accessory.status.slice(1).toLowerCase() : 'Draft'}
            </span>
            <span className={`px-4 py-1.5 rounded-lg text-[13px] font-bold ${accessory.isVisible ? 'bg-[#00a86b] text-white' : 'bg-gray-400 text-white'}`}>
              {accessory.isVisible ? 'Visible' : 'Hidden'}
            </span>

            <div className="flex items-center gap-2 ml-2">
              <Link
                href={`/admin/accessories/edit/${accessory.id}`}
                className="p-1.5 px-3 bg-white border border-gray-200 rounded-lg text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
              >
                <Pencil className="h-4 w-4" />
              </Link>

              <Link
                href={`/accessory/${accessory.slug}`}
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
              <div className="w-full lg:w-[45%]">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-center gap-4 h-full min-h-[250px] shadow-sm">
                  {heroImages.length > 0 ? (
                    heroImages.map((img, idx) => {
                      const imageUrl = getImageUrl(img);
                      return (
                        <div key={idx} className="flex-1 rounded-xl overflow-hidden flex items-center justify-center h-[200px]">
                          <img
                            src={imageUrl || ''}
                            alt={`${accessory.productName} ${idx}`}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-gray-400 font-medium text-sm">No images available</div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-[55%] flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      {accessory.brand?.brandName || 'Unknown Brand'}
                    </span>
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      {accessory.category || 'Uncategorized'}
                    </span>
                    {accessory.isFeatured && (
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                        Featured
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[13px] font-bold uppercase tracking-wider rounded-lg">
                      SKU: {accessory.sku}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                    <h1 className="text-[28px] sm:text-[32px] font-black text-[#1e2a4a] leading-tight tracking-tight flex-1">
                      {accessory.productName || 'Accessory Name'}
                    </h1>

                    <div className="bg-green-50/80 px-6 py-4 rounded-[24px] text-center min-w-[140px] shrink-0 border border-green-100">
                      <div className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-1">Sale Price</div>
                      <div className="text-[26px] font-black text-green-600 leading-none">
                        ${accessory.salePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between border-t border-gray-50 pt-6">
                  <div>
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Current Pricing</div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-[24px] font-black text-[#1e2a4a] leading-none">
                        ${accessory.salePrice.toFixed(2)}
                      </span>
                      {accessory.regularPrice != null && accessory.regularPrice > accessory.salePrice && (
                        <span className="text-[16px] font-medium text-gray-400 line-through">
                          ${accessory.regularPrice.toFixed(2)}
                        </span>
                      )}
                      {accessory.mapPrice > 0 && (
                        <span className="px-3 py-1 bg-white border border-gray-200 text-gray-500 rounded-full text-[12px] font-bold">
                          MAP ${accessory.mapPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-2">Stock</div>
                    <div className="text-[20px] font-bold text-[#1e2a4a] leading-none">
                      {accessory.stock}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Side Images Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">Left Side Image</h3>
                </div>
                <div className="px-8 py-6 flex items-center justify-center min-h-[180px]">
                  {accessory.leftImage ? (
                    <div className="w-full max-w-[200px] h-[160px] rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                      <img
                        src={getImageUrl(accessory.leftImage) || ''}
                        alt="Left side"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic text-center">No left side image</p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-500" />
                  <h3 className="text-[18px] font-bold text-[#1e2a4a]">Right Side Image</h3>
                </div>
                <div className="px-8 py-6 flex items-center justify-center min-h-[180px]">
                  {accessory.rightImage ? (
                    <div className="w-full max-w-[200px] h-[160px] rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                      <img
                        src={getImageUrl(accessory.rightImage) || ''}
                        alt="Right side"
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic text-center">No right side image</p>
                  )}
                </div>
              </div>
            </div>
            {/* Specifications Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-purple-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Specifications</h3>
              </div>
              <div className="px-8 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  {SPECIFICATION_FIELDS.map((field) => (
                    <InfoRow key={field.key} label={field.label} value={specs[field.key]} />
                  ))}
                </div>
              </div>
            </div>

            {/* Sky Score Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Sky Score (0-10)</h3>
              </div>
              <div className="px-8 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{accessory.materialHardnessScore ?? 0}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Material Hardness</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{accessory.threadPrecisionScore ?? 0}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Thread Precision</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{accessory.torqueRetentionScore ?? 0}/10</div>
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">Torque Retention</div>
                  </div>
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-2xl font-black text-[#1e2a4a]">{accessory.feedbackScore ?? 0}/10</div>
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
                <InfoRow label="Regular Price" value={accessory.regularPrice != null ? `$${accessory.regularPrice.toFixed(2)}` : null} />
                <InfoRow label="Unit Cost" value={`$${accessory.cost.toFixed(2)}`} color="text-blue-600 font-bold" />
                <InfoRow label="MAP Price" value={accessory.mapPrice > 0 ? `$${accessory.mapPrice.toFixed(2)}` : null} />
                <InfoRow label="Shipping Cost" value={`$${accessory.shippingCost.toFixed(2)}`} />
                <InfoRow label="Handling Fee" value={`$${accessory.handlingFee.toFixed(2)}`} />
              </div>
            </div>

            {/* Inventory Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Inventory & Logistics</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow label="SKU" value={<span className="font-bold">{accessory.sku}</span>} />
                <InfoRow label="Brand" value={accessory.brand?.brandName} />
                <InfoRow label="Category" value={accessory.category} />
                <InfoRow label="Package Include" value={accessory.packageInclude} />
                <InfoRow label="Stock Level" value={<span className="font-bold">{accessory.stock} units</span>} />
                <InfoRow
                  label="Inventory Source"
                  value={
                    accessory.source?.source ? (
                      <span className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[13px] font-bold rounded-full">
                        {accessory.source.source}
                      </span>
                    ) : (
                      <span className="text-gray-300 italic">No source assigned</span>
                    )
                  }
                />
              </div>
            </div>

            {/* Marketing Section */}
            <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-500" />
                <h3 className="text-[18px] font-bold text-[#1e2a4a]">Marketing & Content</h3>
              </div>
              <div className="px-8 py-2">
                <InfoRow
                  label="Keywords"
                  value={
                    <div className="flex flex-wrap gap-2">
                      {accessory.keywords ? (
                        accessory.keywords.split(';').filter(Boolean).map((kw, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-600 text-[13px] font-bold rounded-full">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300 italic">No keywords</span>
                      )}
                    </div>
                  }
                />
                <InfoRow label="SEO Title" value={accessory.seoTitle} />
                <div className="flex flex-col py-4">
                  <span className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-2">Meta Description</span>
                  <p className="text-[15px] text-[#1e2a4a] leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {accessory.metaDescription || <span className="text-gray-300 italic">No description provided</span>}
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
