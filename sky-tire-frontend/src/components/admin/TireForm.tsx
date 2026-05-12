'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createTire, updateTire } from '@/redux/slices/tiresSlice';
import { fetchInventorySources } from '@/redux/slices/inventorySourcesSlice';
import { Tire, InventorySource } from '@/redux/types/tireTypes';
import { TireSize } from '@/redux/types/tireSizeTypes';
import { ArrowLeft, Loader2, X, Search, ChevronDown, Check, Plus, Calculator, Settings2 } from 'lucide-react';
import { calculatePricing } from '@/utils/pricing';
import axios from 'axios';
import toast from 'react-hot-toast';
import ManageInventorySourcesModal from './ManageInventorySourcesModal';

interface TireFormProps {
  editTire?: Tire;
}

export default function TireForm({ editTire }: TireFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { sources } = useAppSelector((state) => state.inventorySources);

  const [loading, setLoading] = useState(false);
  const [tireSizes, setTireSizes] = useState<TireSize[]>([]);
  
  // Tire Size Dropdown State
  const [sizeSearch, setSizeSearch] = useState('');
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const sizeDropdownRef = React.useRef<HTMLDivElement>(null);

  // Inventory Source Dropdown State
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);

  const [formData, setFormData] = useState({
    tireSizeId: '',
    sku: '',
    stock: '0',
    cost: '0',
    salePrice: '0',
    regularPrice: '0',
    mapPrice: '0',
    shippingCost: '0',
    handlingFee: '0',
    freightCharges: '0',
    rebateAvailable: false,
    mileageScore: '',
    tractionScore: '',
    stabilityScore: '',
    feedbackScore: '',
    sourceIds: [] as string[],
  });

  const [processingPercentage] = useState(3.5);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sizesRes = await axios.get('/api/admin/tire-sizes/dropdown');
        setTireSizes(sizesRes.data);
        dispatch(fetchInventorySources());
      } catch (error) {
        console.error('Error fetching form data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (editTire) {
      setFormData({
        tireSizeId: editTire.tireSizeId,
        sku: editTire.sku,
        stock: editTire.stock.toString(),
        cost: editTire.cost.toString(),
        salePrice: editTire.salePrice.toString(),
        regularPrice: editTire.regularPrice.toString(),
        mapPrice: editTire.mapPrice.toString(),
        shippingCost: editTire.shippingCost.toString(),
        handlingFee: editTire.handlingFee.toString(),
        freightCharges: editTire.freightCharges.toString(),
        rebateAvailable: editTire.rebateAvailable,
        mileageScore: editTire.mileageScore?.toString() || '',
        tractionScore: editTire.tractionScore?.toString() || '',
        stabilityScore: editTire.stabilityScore?.toString() || '',
        feedbackScore: editTire.feedbackScore?.toString() || '',
        sourceIds: editTire.sources?.map(s => s.id) || [],
      });
    }
  }, [editTire]);

  const pricing = useMemo(() => {
    return calculatePricing(
      Number(formData.cost),
      Number(formData.freightCharges),
      Number(formData.salePrice),
      processingPercentage
    );
  }, [formData.cost, formData.freightCharges, formData.salePrice, processingPercentage]);

  const toggleSource = (sourceId: string) => {
    setFormData(prev => {
      const isSelected = prev.sourceIds.includes(sourceId);
      if (isSelected) {
        return { ...prev, sourceIds: prev.sourceIds.filter(id => id !== sourceId) };
      } else {
        return { ...prev, sourceIds: [...prev.sourceIds, sourceId] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const costNum = Number(formData.cost);
    const saleNum = Number(formData.salePrice);
    const regularNum = Number(formData.regularPrice);
    const mapNum = Number(formData.mapPrice);

    if (costNum < 0) return toast.error('Cost cannot be less than 0');
    if (saleNum < 0) return toast.error('Sale price cannot be less than 0');
    if (regularNum > 0 && regularNum <= saleNum) return toast.error('Regular price must be greater than sale price');
    if (mapNum > 0 && saleNum < mapNum) return toast.error('Sale price must be >= MAP price');

    // Loss Prevention Warning
    if (saleNum < pricing.netCost && !window.confirm(`Warning: Sale price ($${saleNum}) is less than Net Cost ($${pricing.netCost.toFixed(2)}). Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        stock: parseInt(formData.stock) || 0,
        cost: parseFloat(formData.cost) || 0,
        salePrice: parseFloat(formData.salePrice) || 0,
        regularPrice: parseFloat(formData.regularPrice) || 0,
        mapPrice: parseFloat(formData.mapPrice) || 0,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        handlingFee: parseFloat(formData.handlingFee) || 0,
        freightCharges: parseFloat(formData.freightCharges) || 0,
        mileageScore: parseInt(formData.mileageScore) || 0,
        tractionScore: parseInt(formData.tractionScore) || 0,
        stabilityScore: parseInt(formData.stabilityScore) || 0,
        feedbackScore: parseInt(formData.feedbackScore) || 0,
      };

      if (editTire) {
        await dispatch(updateTire({ id: editTire.id, data: payload })).unwrap();
        toast.success('Tire updated successfully');
      } else {
        await dispatch(createTire(payload)).unwrap();
        toast.success('Tire created successfully');
      }
      router.push('/admin/tires');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save tire');
    } finally {
      setLoading(false);
    }
  };

  const filteredSizes = tireSizes.filter(size => {
    const searchStr = `${size.tireSize} ${size.model?.modelName} ${size.model?.brand?.brandName}`.toLowerCase();
    return searchStr.includes(sizeSearch.toLowerCase());
  });

  // Handle outside clicks for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-[24px] font-bold text-[#1e2a4a]">
          {editTire ? 'Edit Tire' : 'Add New Tire'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tire Size Selection */}
            <div className="relative w-full" ref={sizeDropdownRef}>
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Tire Size</label>
              <div 
                className={`w-full px-4 py-3.5 bg-transparent border ${isSizeDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-200'} rounded-xl text-[#1e2a4a] cursor-pointer flex items-center justify-between transition-all`}
                onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
              >
                <span className={`text-[16px] ${!formData.tireSizeId ? 'text-gray-500' : 'font-medium'}`}>
                  {formData.tireSizeId 
                    ? tireSizes.find(s => s.id === formData.tireSizeId)?.tireSize + ` (${tireSizes.find(s => s.id === formData.tireSizeId)?.model?.brand?.brandName} ${tireSizes.find(s => s.id === formData.tireSizeId)?.model?.modelName})`
                    : 'Select Tire Size'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSizeDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isSizeDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search sizes..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-[14px] outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
                        value={sizeSearch}
                        onChange={(e) => setSizeSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredSizes.length > 0 ? (
                      filteredSizes.map((size) => (
                        <div 
                          key={size.id}
                          className={`px-4 py-3 text-[14px] cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${formData.tireSizeId === size.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`}
                          onClick={() => {
                            setFormData({ ...formData, tireSizeId: size.id });
                            setIsSizeDropdownOpen(false);
                            setSizeSearch('');
                          }}
                        >
                          <span>{size.tireSize} <span className="text-gray-400 font-normal text-[13px] ml-2">({size.model?.brand?.brandName} {size.model?.modelName})</span></span>
                          {formData.tireSizeId === size.id && <Check className="h-4 w-4" />}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400 text-[14px]">No sizes found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">SKU</label>
              <input type="text" placeholder="SKU" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventory Sources Multi-select */}
            <div className="relative w-full" ref={sourceDropdownRef}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-[14px] font-medium text-gray-400 uppercase tracking-wider">Inventory Sources</label>
                <button 
                  type="button"
                  onClick={() => setIsManageSourcesOpen(true)}
                  className="text-blue-500 hover:text-blue-600 text-[14px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" /> Manage
                </button>
              </div>
              <div 
                className={`w-full px-4 py-3.5 bg-transparent border ${isSourceDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-200'} rounded-xl text-[#1e2a4a] cursor-pointer flex items-center justify-between transition-all min-h-[54px]`}
                onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
              >
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
                      <div 
                        key={source.id}
                        className={`px-4 py-3 text-[14px] cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${formData.sourceIds.includes(source.id) ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`}
                        onClick={() => toggleSource(source.id)}
                      >
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

            <div className="relative w-full self-end">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Stock</label>
              <input type="number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Cost ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50 font-bold text-blue-600" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
            </div>

            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Live Sale Price ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50 font-bold text-green-600" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} />
              {pricing.recommendedSalePrice && Number(formData.salePrice) < parseFloat(pricing.recommendedSalePrice) && (
                <p className="mt-1 text-[13px] font-medium text-orange-500 italic">
                  Recommended sale price is: ${pricing.recommendedSalePrice} (23%)
                </p>
              )}
              {pricing.marginPercentage && (
                <div className={`mt-1 text-[11px] font-bold uppercase tracking-wider ${parseFloat(pricing.marginPercentage) < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                  Markup: {pricing.marginPercentage}%
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Regular Price ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.regularPrice} onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">MAP Price ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.mapPrice} onChange={(e) => setFormData({ ...formData, mapPrice: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Freight Charges ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.freightCharges} onChange={(e) => setFormData({ ...formData, freightCharges: e.target.value })} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Shipping Cost ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Handling Fee ($)</label>
              <input type="number" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.handlingFee} onChange={(e) => setFormData({ ...formData, handlingFee: e.target.value })} />
            </div>
          </div>

          {/* Pricing Info Summary Box */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Calculator className="h-3 w-3" /> Processing Amount (3.5%)
              </p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.processingAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Cost</p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.netCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Margin (based on Net Cost)</p>
              <p className={`text-[18px] font-black ${pricing.marginPercentage && parseFloat(pricing.marginPercentage) < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                {pricing.marginPercentage ? `${pricing.marginPercentage}%` : "0.00%"}
              </p>
            </div>
          </div>

          <div className="pt-4 space-y-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer w-fit">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer h-5 w-5 appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:bg-blue-500 checked:border-blue-500" checked={formData.rebateAvailable} onChange={(e) => setFormData({ ...formData, rebateAvailable: e.target.checked })} />
                  <Check className="absolute left-0.5 top-0.5 h-4 w-4 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                </div>
                <span className="text-[16px] font-bold text-[#1e2a4a]">Rebate Available</span>
              </label>
            </div>

            <div className="space-y-4">
              <h3 className="text-[16px] font-bold text-[#1e2a4a]">Sky Score (0-10)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <input 
                  type="number" 
                  placeholder="Mileage Score" 
                  className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white focus:border-blue-500/30 transition-all placeholder:text-gray-400" 
                  value={formData.mileageScore} 
                  onChange={(e) => setFormData({ ...formData, mileageScore: e.target.value })} 
                />
                <input 
                  type="number" 
                  placeholder="Stability Score" 
                  className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white focus:border-blue-500/30 transition-all placeholder:text-gray-400" 
                  value={formData.stabilityScore} 
                  onChange={(e) => setFormData({ ...formData, stabilityScore: e.target.value })} 
                />
                <input 
                  type="number" 
                  placeholder="Traction Score" 
                  className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white focus:border-blue-500/30 transition-all placeholder:text-gray-400" 
                  value={formData.tractionScore} 
                  onChange={(e) => setFormData({ ...formData, tractionScore: e.target.value })} 
                />
                <input 
                  type="number" 
                  placeholder="Feedback" 
                  className="w-full px-4 py-4 bg-[#f8f9fa] border border-gray-100 rounded-xl text-[#1e2a4a] text-[15px] outline-none focus:bg-white focus:border-blue-500/30 transition-all placeholder:text-gray-400" 
                  value={formData.feedbackScore} 
                  onChange={(e) => setFormData({ ...formData, feedbackScore: e.target.value })} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button type="submit" disabled={loading} className="px-10 py-4 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-3">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editTire ? 'Update Tire' : 'Create Tire')}
          </button>
        </div>
      </form>

      {isManageSourcesOpen && (
        <ManageInventorySourcesModal onClose={() => setIsManageSourcesOpen(false)} />
      )}
    </div>
  );
}
