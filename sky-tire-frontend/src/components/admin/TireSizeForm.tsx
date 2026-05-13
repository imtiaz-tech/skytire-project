'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createTireSize, updateTireSize } from '@/redux/slices/tireSizesSlice';
import { createTire, updateTire } from '@/redux/slices/tiresSlice';
import { fetchInventorySources } from '@/redux/slices/inventorySourcesSlice';
import { TireSize } from '@/redux/types/tireSizeTypes';
import { Tire } from '@/redux/types/tireTypes';
import { ArrowLeft, Loader2, X, Search, ChevronDown, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import TireFieldsSection from './TireFieldsSection';
import ManageInventorySourcesModal from './ManageInventorySourcesModal';

interface TireSizeFormProps {
  editSizeId?: string;
  editTireId?: string;
}

const vehicleTypeOptions = [
  { label: 'Passenger', value: 'PASSENGER' },
  { label: 'Light Truck', value: 'LIGHT_TRUCK' },
  { label: 'SUV', value: 'SUV' },
  { label: 'Truck', value: 'TRUCK' },
  { label: 'Commercial', value: 'COMMERCIAL' },
  { label: 'Performance', value: 'PERFORMANCE' },
  { label: 'Off-Road', value: 'OFF_ROAD' },
];

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const sidewallCategoryOptions = [
  { label: 'Black Wall', value: 'BLACK_WALL' },
  { label: 'White Wall', value: 'WHITE_WALL' },
];

export default function TireSizeForm({ editSizeId, editTireId }: TireSizeFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const isCombinedMode = searchParams.get('mode') === 'combined' || !!editTireId;

  const { sources } = useAppSelector((state) => state.inventorySources);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [models, setModels] = useState<{ id: string; modelName: string; brand?: { brandName: string } }[]>([]);
  
  // Custom Searchable Dropdown State
  const [modelSearch, setModelSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Keywords State
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  // Tire Details State
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);

  const [sizeFormData, setSizeFormData] = useState({
    modelId: '',
    tireSize: '',
    tireWidth: '',
    aspectRatio: '',
    rimDiameter: '',
    loadIndex: '',
    speedRating: '',
    loadRange: '',
    inflationPressure: '',
    tireWeight: '',
    shippingDimensions: '',
    utqg: '',
    seoTitle: '',
    metaDescription: '',
    status: 'ACTIVE',
    vehicleType: '',
    sidewallCategory: '',
    sidewallDetail: '',
  });

  const [tireFormData, setTireFormData] = useState({
    sku: '',
    alternatePartNumber: '',
    upcNo: '',
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

  const processingPercentage = 3.5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/admin/tire-models/dropdown');
        setModels(response.data);
        if (isCombinedMode) {
          dispatch(fetchInventorySources());
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchData();
  }, [dispatch, isCombinedMode]);

  // Initial Data Population
  useEffect(() => {
    const loadInitialData = async () => {
      if (!editSizeId && !editTireId) return;
      
      setFetching(true);
      try {
        let sizeData: any = null;
        let tireData: any = null;
        const sourceParam = searchParams.get('source');

        if (sourceParam === 'size') {
          // In this case, editTireId is actually the Size ID
          const sizeRes = await axios.get(`/api/admin/tire-sizes/${editTireId}`);
          sizeData = sizeRes.data;
          
          // Try to find an associated tire for this size
          try {
            const tireRes = await axios.get(`/api/admin/tires/by-size/${editTireId}`);
            if (tireRes.data) tireData = tireRes.data;
          } catch (e) {
            console.log("No associated tire found for this size yet");
          }
        } else if (editTireId) {
          const tireRes = await axios.get(`/api/admin/tires/${editTireId}`);
          tireData = tireRes.data;
          sizeData = tireData.tireSize;
        } else if (editSizeId) {
          const sizeRes = await axios.get(`/api/admin/tire-sizes/${editSizeId}`);
          sizeData = sizeRes.data;
        }

        if (sizeData) {
          setSizeFormData({
            modelId: sizeData.modelId,
            tireSize: sizeData.tireSize || '',
            tireWidth: sizeData.tireWidth || '',
            aspectRatio: sizeData.aspectRatio || '',
            rimDiameter: sizeData.rimDiameter || '',
            loadIndex: sizeData.loadIndex || '',
            speedRating: sizeData.speedRating || '',
            loadRange: sizeData.loadRange || '',
            inflationPressure: sizeData.inflationPressure || '',
            tireWeight: sizeData.tireWeight || '',
            shippingDimensions: sizeData.shippingDimensions || '',
            utqg: sizeData.utqg || '',
            seoTitle: sizeData.seoTitle || '',
            metaDescription: sizeData.metaDescription || '',
            status: sizeData.status || 'ACTIVE',
            vehicleType: sizeData.vehicleType || '',
            sidewallCategory: sizeData.sidewallCategory || '',
            sidewallDetail: sizeData.sidewallDetail || '',
          });

          if (sizeData.keywords) {
            try {
              const kws = sizeData.keywords.startsWith('[') ? JSON.parse(sizeData.keywords) : sizeData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
              setKeywordArray(kws);
            } catch (e) {
              setKeywordArray(sizeData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean));
            }
          }
        }

        if (tireData) {
          setTireFormData({
            sku: tireData.sku,
            alternatePartNumber: tireData.alternatePartNumber || '',
            upcNo: tireData.upcNo || '',
            stock: tireData.stock.toString(),
            cost: tireData.cost.toString(),
            salePrice: tireData.salePrice.toString(),
            regularPrice: tireData.regularPrice.toString(),
            mapPrice: tireData.mapPrice.toString(),
            shippingCost: tireData.shippingCost.toString(),
            handlingFee: tireData.handlingFee.toString(),
            freightCharges: tireData.freightCharges.toString(),
            rebateAvailable: tireData.rebateAvailable,
            mileageScore: tireData.mileageScore?.toString() || '',
            tractionScore: tireData.tractionScore?.toString() || '',
            stabilityScore: tireData.stabilityScore?.toString() || '',
            feedbackScore: tireData.feedbackScore?.toString() || '',
            sourceIds: tireData.sources?.map((s: any) => s.id) || [],
          });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, [editSizeId, editTireId]);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const searchStr = `${model.modelName} ${model.brand?.brandName || ''}`.toLowerCase();
      return searchStr.includes(modelSearch.toLowerCase());
    });
  }, [models, modelSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSource = (sourceId: string) => {
    setTireFormData(prev => {
      const isSelected = prev.sourceIds.includes(sourceId);
      if (isSelected) {
        return { ...prev, sourceIds: prev.sourceIds.filter(id => id !== sourceId) };
      } else {
        return { ...prev, sourceIds: [...prev.sourceIds, sourceId] };
      }
    });
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ';') {
      e.preventDefault();
      const val = keywordInput.trim().replace(/;$/, '');
      if (val && !keywordArray.includes(val)) {
        setKeywordArray([...keywordArray, val]);
      }
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywordArray(keywordArray.filter((k) => k !== kw));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sizePayload = {
      ...sizeFormData,
      keywords: JSON.stringify(keywordArray),
    };

    try {
      let tireSizeId = editSizeId;
      
      // Step 1: Handle Tire Size
      if (editSizeId || (editTireId && tireFormData.sku)) {
        // Find existing size id from tire if editing tire
        const actualSizeId = editSizeId || (await axios.get(`/api/admin/tires/${editTireId}`)).data.tireSizeId;
        await dispatch(updateTireSize({ id: actualSizeId, data: sizePayload })).unwrap();
        tireSizeId = actualSizeId;
      } else {
        // Create new size
        const result = await dispatch(createTireSize(sizePayload)).unwrap();
        tireSizeId = result.id;
      }

      // Step 2: Handle Tire (if combined mode)
      if (isCombinedMode) {
        const tirePayload = {
          ...tireFormData,
          tireSizeId,
          stock: parseInt(tireFormData.stock) || 0,
          cost: parseFloat(tireFormData.cost) || 0,
          salePrice: parseFloat(tireFormData.salePrice) || 0,
          regularPrice: parseFloat(tireFormData.regularPrice) || 0,
          mapPrice: parseFloat(tireFormData.mapPrice) || 0,
          shippingCost: parseFloat(tireFormData.shippingCost) || 0,
          handlingFee: parseFloat(tireFormData.handlingFee) || 0,
          freightCharges: parseFloat(tireFormData.freightCharges) || 0,
          mileageScore: parseInt(tireFormData.mileageScore) || 0,
          tractionScore: parseInt(tireFormData.tractionScore) || 0,
          stabilityScore: parseInt(tireFormData.stabilityScore) || 0,
          feedbackScore: parseInt(tireFormData.feedbackScore) || 0,
        };

        if (editTireId) {
          await dispatch(updateTire({ id: editTireId, data: tirePayload })).unwrap();
          toast.success('Tire and Size updated');
        } else {
          await dispatch(createTire(tirePayload)).unwrap();
          toast.success('Tire and Size created');
        }
      } else {
        toast.success(editSizeId ? 'Tire Size updated' : 'Tire Size created');
      }

      router.push(isCombinedMode ? '/admin/tires' : '/admin/tire-sizes');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save data');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#1e2a4a] animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Loading combined form data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e2a4a]">
          {editTireId ? 'Edit Tire & Size' : (editSizeId ? 'Edit Tire Size' : (isCombinedMode ? 'Add New Tire (Combined)' : 'Add New Tire Size'))}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Section 1: Tire Size Details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Section 1: Tire Size Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full" ref={dropdownRef}>
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Tire Model</label>
              <div 
                className={`w-full px-4 py-3.5 bg-transparent border ${isDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-200'} rounded-xl text-[#1e2a4a] cursor-pointer flex items-center justify-between transition-all`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <span className={`text-[16px] ${!sizeFormData.modelId ? 'text-gray-500' : 'font-medium'}`}>
                  {sizeFormData.modelId 
                    ? models.find(m => m.id === sizeFormData.modelId)?.modelName + (models.find(m => m.id === sizeFormData.modelId)?.brand ? ` (${models.find(m => m.id === sizeFormData.modelId)?.brand?.brandName})` : '')
                    : 'Select Tire Model'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-gray-50 bg-gray-50/50">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Search models..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-100 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model) => (
                        <div 
                          key={model.id}
                          className={`px-4 py-3 text-[16px] cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${sizeFormData.modelId === model.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`}
                          onClick={() => {
                            setSizeFormData({ ...sizeFormData, modelId: model.id });
                            setIsDropdownOpen(false);
                            setModelSearch('');
                          }}
                        >
                          <span>{model.modelName} {model.brand && <span className="text-gray-400 font-normal text-xs ml-2">({model.brand.brandName})</span>}</span>
                          {sizeFormData.modelId === model.id && <Check className="h-4 w-4" />}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">No models found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative w-full">
              {sizeFormData.tireSize && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Tire Size</label>}
              <input 
                type="text" 
                placeholder="Tire Size (e.g. 225/45R17)" 
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
                value={sizeFormData.tireSize} 
                onChange={(e) => setSizeFormData({ ...sizeFormData, tireSize: e.target.value })} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {sizeFormData.tireWidth && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Tire Width</label>}
              <input type="text" placeholder="Tire Width" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.tireWidth} onChange={(e) => setSizeFormData({ ...sizeFormData, tireWidth: e.target.value })} />
            </div>
            <div className="relative w-full">
              {sizeFormData.aspectRatio && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Aspect Ratio</label>}
              <input type="text" placeholder="Aspect Ratio" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.aspectRatio} onChange={(e) => setSizeFormData({ ...sizeFormData, aspectRatio: e.target.value })} />
            </div>
            <div className="relative w-full">
              {sizeFormData.rimDiameter && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Rim Diameter</label>}
              <input type="text" placeholder="Rim Diameter" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.rimDiameter} onChange={(e) => setSizeFormData({ ...sizeFormData, rimDiameter: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {sizeFormData.loadIndex && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Load Index</label>}
              <input type="text" placeholder="Load Index" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.loadIndex} onChange={(e) => setSizeFormData({ ...sizeFormData, loadIndex: e.target.value })} />
            </div>
            <div className="relative w-full">
              {sizeFormData.speedRating && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Speed Rating</label>}
              <input type="text" placeholder="Speed Rating" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.speedRating} onChange={(e) => setSizeFormData({ ...sizeFormData, speedRating: e.target.value })} />
            </div>
            <div className="relative w-full">
              {sizeFormData.loadRange && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Load Range</label>}
              <input type="text" placeholder="Load Range" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.loadRange} onChange={(e) => setSizeFormData({ ...sizeFormData, loadRange: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {sizeFormData.inflationPressure && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Inflation Pressure</label>}
              <input type="text" placeholder="Inflation Pressure" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.inflationPressure} onChange={(e) => setSizeFormData({ ...sizeFormData, inflationPressure: e.target.value })} />
            </div>
            <div className="relative w-full">
              {sizeFormData.tireWeight && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Tire Weight</label>}
              <input type="text" placeholder="Tire Weight" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.tireWeight} onChange={(e) => setSizeFormData({ ...sizeFormData, tireWeight: e.target.value })} />
            </div>
            <div className="relative w-full">
              {sizeFormData.shippingDimensions && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Dimensions</label>}
              <input type="text" placeholder="Shipping Dimensions" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.shippingDimensions} onChange={(e) => setSizeFormData({ ...sizeFormData, shippingDimensions: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {sizeFormData.utqg && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">UTQG</label>}
              <input type="text" placeholder="UTQG" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.utqg} onChange={(e) => setSizeFormData({ ...sizeFormData, utqg: e.target.value })} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Vehicle Type</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={sizeFormData.vehicleType} onChange={(e) => setSizeFormData({ ...sizeFormData, vehicleType: e.target.value })}>
                <option value="">Select Type</option>
                {vehicleTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Status</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={sizeFormData.status} onChange={(e) => setSizeFormData({ ...sizeFormData, status: e.target.value })}>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Category</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={sizeFormData.sidewallCategory} onChange={(e) => setSizeFormData({ ...sizeFormData, sidewallCategory: e.target.value })}>
                <option value="">Select Category</option>
                {sidewallCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              {sizeFormData.sidewallDetail && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Sidewall</label>}
              <input type="text" placeholder="Sidewall Details" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.sidewallDetail} onChange={(e) => setSizeFormData({ ...sizeFormData, sidewallDetail: e.target.value })} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative w-full">
              {keywordInput && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Keywords</label>}
              <input type="text" placeholder="Press Enter or ; to add keywords" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={handleKeywordKeyDown} />
            </div>
            <div className="flex flex-wrap gap-2">
              {keywordArray.map(kw => (
                <span key={kw} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100">
                  {kw} <X className="h-3 w-3 cursor-pointer" onClick={() => removeKeyword(kw)} />
                </span>
              ))}
            </div>
          </div>

          <div className="relative w-full">
            {sizeFormData.seoTitle && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">SEO Title</label>}
            <input type="text" placeholder="SEO Title" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={sizeFormData.seoTitle} onChange={(e) => setSizeFormData({ ...sizeFormData, seoTitle: e.target.value })} />
          </div>

          <div className="relative w-full">
            {sizeFormData.metaDescription && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Meta Description</label>}
            <textarea placeholder="Meta Description" rows={3} className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none resize-none" value={sizeFormData.metaDescription} onChange={(e) => setSizeFormData({ ...sizeFormData, metaDescription: e.target.value })} />
          </div>
        </div>

        {/* Section 2: Tire Specifications & Pricing */}
        {isCombinedMode && (
          <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-4 px-4">
              <div className="h-px bg-gray-100 flex-1" />
              <h2 className="text-[18px] font-black text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">Section 2: Tire Inventory & Pricing</h2>
              <div className="h-px bg-gray-100 flex-1" />
            </div>
            
            <TireFieldsSection 
              formData={tireFormData}
              setFormData={setTireFormData}
              sources={sources}
              isSourceDropdownOpen={isSourceDropdownOpen}
              setIsSourceDropdownOpen={setIsSourceDropdownOpen}
              sourceDropdownRef={sourceDropdownRef}
              setIsManageSourcesOpen={setIsManageSourcesOpen}
              toggleSource={toggleSource}
              processingPercentage={processingPercentage}
            />
          </div>
        )}

        <div className="flex justify-end pt-8">
          <button type="submit" disabled={loading} className="px-12 py-4 bg-[#1e2a4a] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-3">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editTireId ? 'Update Everything' : (editSizeId ? 'Update Size' : (isCombinedMode ? 'Save Everything' : 'Save Size')))}
          </button>
        </div>
      </form>

      {isManageSourcesOpen && (
        <ManageInventorySourcesModal onClose={() => setIsManageSourcesOpen(false)} />
      )}
    </div>
  );
}
