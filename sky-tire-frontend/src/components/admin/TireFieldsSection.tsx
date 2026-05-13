'use client';

import React, { useMemo } from 'react';
import { X, ChevronDown, Check, Calculator, Settings2 } from 'lucide-react';
import { calculatePricing } from '@/utils/pricing';
import { InventorySource } from '@/redux/types/tireTypes';

interface TireFieldsSectionProps {
  formData: {
    sku: string;
    alternatePartNumber: string;
    upcNo: string;
    stock: string;
    cost: string;
    salePrice: string;
    regularPrice: string;
    mapPrice: string;
    shippingCost: string;
    handlingFee: string;
    freightCharges: string;
    rebateAvailable: boolean;
    mileageScore: string;
    tractionScore: string;
    stabilityScore: string;
    feedbackScore: string;
    sourceIds: string[];
  };
  setFormData: (data: any) => void;
  sources: InventorySource[];
  isSourceDropdownOpen: boolean;
  setIsSourceDropdownOpen: (open: boolean) => void;
  sourceDropdownRef: React.RefObject<HTMLDivElement>;
  setIsManageSourcesOpen: (open: boolean) => void;
  toggleSource: (id: string) => void;
  processingPercentage: number;
}

export default function TireFieldsSection({
  formData,
  setFormData,
  sources,
  isSourceDropdownOpen,
  setIsSourceDropdownOpen,
  sourceDropdownRef,
  setIsManageSourcesOpen,
  toggleSource,
  processingPercentage
}: TireFieldsSectionProps) {
  
  const pricing = useMemo(() => {
    return calculatePricing(
      Number(formData.cost),
      Number(formData.freightCharges),
      Number(formData.salePrice),
      processingPercentage
    );
  }, [formData.cost, formData.freightCharges, formData.salePrice, processingPercentage]);

  return (
    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8 mt-8">
      <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Tire Specifications & Pricing</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative w-full">
          {formData.sku && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">SKU</label>}
          <input type="text" placeholder="SKU" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.sku} onChange={(e) => setFormData((prev: any) => ({ ...prev, sku: e.target.value }))} required />
        </div>

        <div className="relative w-full">
          {formData.alternatePartNumber && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Alternate part number</label>}
          <input type="text" placeholder="Alternate Part Number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.alternatePartNumber} onChange={(e) => setFormData((prev: any) => ({ ...prev, alternatePartNumber: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative w-full">
          {formData.upcNo && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Upc no</label>}
          <input type="text" placeholder="UPC No" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.upcNo} onChange={(e) => setFormData((prev: any) => ({ ...prev, upcNo: e.target.value }))} />
        </div>

        <div className="relative w-full self-end">
          {formData.stock && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Stock</label>}
          <input type="number" placeholder="Stock" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.stock} onChange={(e) => setFormData((prev: any) => ({ ...prev, stock: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative w-full" ref={sourceDropdownRef}>
          <div className="flex items-center justify-between mb-1.5 px-1">
            <label className="text-[14px] font-medium text-gray-400 uppercase tracking-wider">Inventory Sources</label>
            <button type="button" onClick={() => setIsManageSourcesOpen(true)} className="text-blue-500 hover:text-blue-600 text-[14px] font-bold flex items-center gap-1 transition-colors">
              <Settings2 className="h-3.5 w-3.5" /> Manage
            </button>
          </div>
          <div className={`w-full px-4 py-3.5 bg-transparent border ${isSourceDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-200'} rounded-xl text-[#1e2a4a] cursor-pointer flex items-center justify-between transition-all min-h-[54px]`} onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}>
            <div className="flex flex-wrap gap-2 text-[16px]">
              {formData.sourceIds.length > 0 ? (
                formData.sourceIds.map(id => {
                  const source = sources.find(s => s.id === id);
                  return (
                    <span key={id} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[13px] font-bold flex items-center gap-1">
                      {source?.source}
                      <X className="h-3 w-3 hover:text-blue-800" onClick={(e) => { e.stopPropagation(); toggleSource(id); }} />
                    </span>
                  );
                })
              ) : (
                <span className="text-gray-500">Select Sources</span>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          {isSourceDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {sources.length > 0 ? (
                sources.map((source) => (
                  <div key={source.id} className={`px-4 py-3 text-[14px] cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${formData.sourceIds.includes(source.id) ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`} onClick={() => toggleSource(source.id)}>
                    <span>{source.source}</span>
                    {formData.sourceIds.includes(source.id) && <Check className="h-4 w-4" />}
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-400 text-[14px]">No sources found. Click manage to add.</div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-3 cursor-pointer w-fit py-3.5">
            <div className="relative flex items-center">
              <input type="checkbox" className="peer h-5 w-5 appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:bg-blue-500 checked:border-blue-500" checked={formData.rebateAvailable} onChange={(e) => setFormData((prev: any) => ({ ...prev, rebateAvailable: e.target.checked }))} />
              <Check className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
            </div>
            <span className="text-[16px] font-bold text-[#1e2a4a]">Rebate Available</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50 mt-4">
        <div className="relative w-full">
          {formData.cost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Cost ($)</label>}
          <input type="number" placeholder="Cost ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50 font-bold text-blue-600" value={formData.cost} onChange={(e) => setFormData((prev: any) => ({ ...prev, cost: e.target.value }))} />
        </div>

        <div className="relative w-full">
          {formData.salePrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Live Sale Price ($)</label>}
          <input type="number" placeholder="Live Sale Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50 font-bold text-green-600" value={formData.salePrice} onChange={(e) => setFormData((prev: any) => ({ ...prev, salePrice: e.target.value }))} />
          {pricing.recommendedSalePrice && Number(formData.salePrice) < parseFloat(pricing.recommendedSalePrice) && (
            <p className="mt-1 text-[13px] font-medium text-orange-500 italic">Recommended sale price is: ${pricing.recommendedSalePrice} (23%)</p>
          )}
          {pricing.marginPercentage && (
            <div className={`mt-1 text-[11px] font-bold uppercase tracking-wider ${parseFloat(pricing.marginPercentage) < 0 ? 'text-red-500' : 'text-blue-600'}`}>Markup: {pricing.marginPercentage}%</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative w-full">
          {formData.regularPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Regular Price ($)</label>}
          <input type="number" placeholder="Regular Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.regularPrice} onChange={(e) => setFormData((prev: any) => ({ ...prev, regularPrice: e.target.value }))} />
        </div>
        <div className="relative w-full">
          {formData.mapPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">MAP Price ($)</label>}
          <input type="number" placeholder="MAP Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.mapPrice} onChange={(e) => setFormData((prev: any) => ({ ...prev, mapPrice: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative w-full">
          {formData.freightCharges && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Freight Charges ($)</label>}
          <input type="number" placeholder="Freight Charges ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.freightCharges} onChange={(e) => setFormData((prev: any) => ({ ...prev, freightCharges: e.target.value }))} />
        </div>
        <div className="relative w-full">
          {formData.shippingCost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Cost ($)</label>}
          <input type="number" placeholder="Shipping Cost ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.shippingCost} onChange={(e) => setFormData((prev: any) => ({ ...prev, shippingCost: e.target.value }))} />
        </div>
        <div className="relative w-full">
          {formData.handlingFee && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Handling Fee ($)</label>}
          <input type="number" placeholder="Handling Fee ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.handlingFee} onChange={(e) => setFormData((prev: any) => ({ ...prev, handlingFee: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Processing Amount ({processingPercentage}%)</p>
          <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.processingAmount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Cost</p>
          <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.netCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Margin</p>
          <p className={`text-[18px] font-black ${pricing.marginPercentage && parseFloat(pricing.marginPercentage) < 0 ? 'text-red-500' : 'text-blue-600'}`}>{pricing.marginPercentage ? `${pricing.marginPercentage}%` : "0.00%"}</p>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-gray-50">
        <h3 className="text-[16px] font-bold text-[#1e2a4a]">Sky Score (0-10)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative w-full">
            {formData.mileageScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Mileage Score</label>}
            <input type="number" placeholder="Mileage Score" className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white transition-all" value={formData.mileageScore} onChange={(e) => setFormData((prev: any) => ({ ...prev, mileageScore: e.target.value }))} />
          </div>
          <div className="relative w-full">
            {formData.stabilityScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Stability Score</label>}
            <input type="number" placeholder="Stability Score" className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white transition-all" value={formData.stabilityScore} onChange={(e) => setFormData((prev: any) => ({ ...prev, stabilityScore: e.target.value }))} />
          </div>
          <div className="relative w-full">
            {formData.tractionScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Traction Score</label>}
            <input type="number" placeholder="Traction Score" className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white transition-all" value={formData.tractionScore} onChange={(e) => setFormData((prev: any) => ({ ...prev, tractionScore: e.target.value }))} />
          </div>
          <div className="relative w-full">
            {formData.feedbackScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Feedback</label>}
            <input type="number" placeholder="Feedback" className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white transition-all" value={formData.feedbackScore} onChange={(e) => setFormData((prev: any) => ({ ...prev, feedbackScore: e.target.value }))} />
          </div>
        </div>
      </div>
    </div>
  );
}
