'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createTire, updateTire } from '@/redux/slices/tiresSlice';
import { fetchAllInventorySources } from '@/redux/slices/inventorySourcesSlice';
import { Tire } from '@/redux/types/tireTypes';
import { ArrowLeft, Loader2, X, Search, ChevronDown, Check, PlusCircle, UploadCloud } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import TireFieldsSection from './TireFieldsSection';
import ManageInventorySourcesModal from './ManageInventorySourcesModal';
import type { SourceInventoryRow } from '@/lib/sourceInventory';
import { calculateTireNetCostPricing, isSalePriceBelowRecommended } from '@/utils/pricing';
import { useShippingAutoFill } from '@/hooks/useShippingAutoFill';
import {
  isAllowedWireWheelVideoFile,
  isValidYouTubeUrl,
} from '@/lib/youtube';

import ProductCommonFields from './ProductCommonFields';

interface TireSizeFormProps {
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

export default function TireSizeForm({ editTireId }: TireSizeFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();


  const { sources } = useAppSelector((state) => state.inventorySources);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [sourceInventories, setSourceInventories] = useState<SourceInventoryRow[]>([]);
  const [models, setModels] = useState<{ id: string; modelName: string; brand?: { brandName: string } }[]>([]);
  const [activeDuplicateId, setActiveDuplicateId] = useState<string | null>(null);
  
  // Custom Searchable Dropdown State
  const [modelSearch, setModelSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Keywords / Tags / Also Found In / FAQs (UI handled by ProductCommonFields)
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [tagArray, setTagArray] = useState<string[]>([]);
  const [alsoFoundInArray, setAlsoFoundInArray] = useState<string[]>([]);
  const [faqs, setFaqs] = useState('');

  // Features State
  const [featureArray, setFeatureArray] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState('');
  const [isFeatureFocused, setIsFeatureFocused] = useState(false);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [youtubeUrlError, setYoutubeUrlError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);
  const featureSuggestions = [
    "Noise reduction Technology",
    "Without Noise Reduction Technology",
    "Eco Focus",
    "Without eco Focus",
    "Electric Vehicle Tuned",
    "Not Electric Vehicle Tuned",
    "Self-Sealing",
    "Non-Sealing"
  ];

  // Tire Details State
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = React.useRef<HTMLDivElement>(null);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);

  const [formData, setFormData] = useState({
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
    sku: '',
    alternatePartNumber: '',
    upcNo: '',
    stock: '0',
    cost: '0',
    internalShipping: '0',
    processingCharges: '0',
    margin: '0',
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
    publishStatus: 'PUBLISHED',
    youtubeUrl: '',
  });

  const { handleSizeBlur, handleSizeChange } = useShippingAutoFill({
    category: 'TIRE',
    weightField: 'tireWeight',
    onApply: useCallback((fields) => {
      setFormData((prev) => ({ ...prev, ...fields }));
    }, []),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/admin/tire-models?dropdown=true');
        setModels(response.data);
        dispatch(fetchAllInventorySources());
      } catch (error) {
        console.error('Error fetching models:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !editTireId) {
      const id = sessionStorage.getItem('duplicateTireId');
      if (id) {
        setActiveDuplicateId(id);
        sessionStorage.removeItem('duplicateTireId');
      }
    }
  }, [editTireId]);

  // Initial Data Population
  useEffect(() => {
    const loadInitialData = async () => {
      const targetId = editTireId || activeDuplicateId;
      if (!targetId) return;
      
      setFetching(true);
      try {
        const tireRes = await axios.get(`/api/admin/tires/${targetId}`);
        const tire = tireRes.data;
        
        setFormData({
          modelId: tire.modelId || '',
          tireSize: tire.tireSize || '',
          tireWidth: tire.tireWidth || '',
          aspectRatio: tire.aspectRatio || '',
          rimDiameter: tire.rimDiameter || '',
          loadIndex: tire.loadIndex || '',
          speedRating: tire.speedRating || '',
          loadRange: tire.loadRange || '',
          inflationPressure: tire.inflationPressure || '',
          tireWeight: tire.tireWeight || '',
          shippingDimensions: tire.shippingDimensions || '',
          utqg: tire.utqg || '',
          seoTitle: tire.seoTitle || '',
          metaDescription: tire.metaDescription || '',
          status: tire.status || 'ACTIVE',
          vehicleType: tire.vehicleType || '',
          sidewallCategory: tire.sidewallCategory || '',
          sidewallDetail: tire.sidewallDetail || '',
          sku: activeDuplicateId ? '' : (tire.sku || ''),
          alternatePartNumber: tire.alternatePartNumber || '',
          upcNo: tire.upcNo || '',
          stock: String(tire.stock || 0),
          cost: tire.cost ? tire.cost.toFixed(2) : '0',
          internalShipping: tire.internalShipping != null ? tire.internalShipping.toFixed(2) : '0',
          processingCharges: tire.processingCharges != null ? String(tire.processingCharges) : '0',
          margin: tire.margin != null ? String(tire.margin) : '0',
          salePrice: tire.salePrice ? tire.salePrice.toFixed(2) : '0',
          regularPrice: tire.regularPrice ? tire.regularPrice.toFixed(2) : '0',
          mapPrice: tire.mapPrice ? tire.mapPrice.toFixed(2) : '0',
          shippingCost: tire.shippingCost ? tire.shippingCost.toFixed(2) : '0',
          handlingFee: tire.handlingFee ? tire.handlingFee.toFixed(2) : '0',
          freightCharges: tire.freightCharges ? tire.freightCharges.toFixed(2) : '0',
          rebateAvailable: !!tire.rebateAvailable,
          mileageScore: String(tire.mileageScore || 0),
          tractionScore: String(tire.tractionScore || 0),
          stabilityScore: String(tire.stabilityScore || 0),
          feedbackScore: String(tire.feedbackScore || 0),
          sourceIds: tire.sources?.map((s: any) => s.id) || [],
          publishStatus: tire.publishStatus || 'PUBLISHED',
          youtubeUrl: tire.youtubeUrl || '',
        });
        setExistingVideo(tire.video || null);
        setVideoFile(null);
        setSourceInventories(tire.sourceInventories || []);

        if (tire.keywords) {
          setKeywordArray(tire.keywords.split(';').filter(Boolean));
        }
        if (tire.features && Array.isArray(tire.features)) {
          setFeatureArray(tire.features);
        }
        setFaqs(tire.faqs || '');
        setTagArray(Array.isArray(tire.tags) ? tire.tags : []);
        setAlsoFoundInArray(Array.isArray(tire.alsoFoundIn) ? tire.alsoFoundIn : []);
      } catch (error) {
        console.error('Error loading tire data:', error);
        toast.error('Failed to load tire data');
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, [editTireId, activeDuplicateId]);

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
    setFormData(prev => {
      const isSelected = prev.sourceIds.includes(sourceId);
      if (isSelected) {
        return { ...prev, sourceIds: [] };
      } else {
        return { ...prev, sourceIds: [sourceId] };
      }
    });
    setIsSourceDropdownOpen(false); // Optionally close dropdown for single-select UX
  };

  const handleFeatureKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ':') {
      e.preventDefault();
      const val = featureInput.trim().replace(/:$/, '');
      if (val && !featureArray.includes(val)) {
        setFeatureArray([...featureArray, val]);
      }
      setFeatureInput('');
    }
  };

  const removeFeature = (feat: string) => {
    setFeatureArray(featureArray.filter((f) => f !== feat));
  };

  const addFeatureFromSuggestion = (feat: string) => {
    if (!featureArray.includes(feat)) {
      setFeatureArray([...featureArray, feat]);
    }
    setFeatureInput('');
    setIsFeatureFocused(false);
  };

  const getUploadUrl = (path: string) => {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedWireWheelVideoFile(file)) {
      toast.error('Video must be an mp4, mov, or webm file');
      e.target.value = '';
      return;
    }
    setVideoFile(file);
    e.target.value = '';
  };

  const removeVideo = () => {
    setVideoFile(null);
    setExistingVideo(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleYoutubeUrlChange = (value: string) => {
    setFormData({ ...formData, youtubeUrl: value });
    const trimmed = value.trim();
    if (trimmed && !isValidYouTubeUrl(trimmed)) {
      setYoutubeUrlError('Please enter a valid YouTube Video URL');
    } else {
      setYoutubeUrlError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'PUBLISHED' | 'DRAFT') => {
    e.preventDefault();
    if (!formData.modelId) return toast.error('Model must be selected');

    const finalStatus = statusOverride || formData.publishStatus || 'PUBLISHED';
    const trimmedYoutube = (formData.youtubeUrl || '').trim();

    if (trimmedYoutube && !isValidYouTubeUrl(trimmedYoutube)) {
      setYoutubeUrlError('Please enter a valid YouTube Video URL');
      return toast.error('Please enter a valid YouTube Video URL');
    }

    if (finalStatus !== 'DRAFT') {
      // Required Field Validations
      if (!formData.tireSize) return toast.error('Tire Size is required');
      if (!formData.vehicleType) return toast.error('Vehicle Type is required');
      if (!formData.sidewallCategory) return toast.error('Sidewall Category is required');
      if (!formData.sku) return toast.error('SKU is required');
      if (!formData.sourceIds || formData.sourceIds.length === 0) return toast.error('Inventory Source is required');
      
      const stockNum = parseInt(formData.stock) || 0;
      const costNum = parseFloat(formData.cost) || 0;
      const saleNum = parseFloat(formData.salePrice) || 0;
      const regularNum = parseFloat(formData.regularPrice) || 0;
      const mapNum = parseFloat(formData.mapPrice) || 0;
      const tirePricing = calculateTireNetCostPricing(
        costNum,
        parseFloat(formData.internalShipping) || 0,
        parseFloat(formData.processingCharges) || 0,
        parseFloat(formData.margin) || 0
      );

      if (stockNum <= 0) return toast.error('Stock must be greater than 0');
      if (costNum <= 0) return toast.error('Cost Price is required');
      if (saleNum <= 0) return toast.error('Sale Price is required');
      if (regularNum <= 0) return toast.error('Regular Price is required');
      if (mapNum <= 0) return toast.error('MAP Price is required');

      if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
        return toast.error('Sale Price cannot be lower than the Recommended Sale Price.');
      }

      // Price Logic Validations
      if (saleNum <= costNum) {
        return toast.error('Sale price must be greater than cost');
      }
      if (regularNum <= saleNum) {
        return toast.error('Regular price must be greater than sale price');
      }
      if (saleNum < mapNum) {
        return toast.error('Sale price must be greater than or equal to MAP price');
      }
    }

    setLoading(true);
    try {
      const costNum = parseFloat(formData.cost) || 0;
      const internalShippingNum = parseFloat(formData.internalShipping) || 0;
      const processingChargesNum = parseFloat(formData.processingCharges) || 0;
      const marginNum = parseFloat(formData.margin) || 0;
      const tirePricing = calculateTireNetCostPricing(
        costNum,
        internalShippingNum,
        processingChargesNum,
        marginNum
      );
      const processingAmount = tirePricing.processingAmount;
      const netCost = tirePricing.netCost;
      const marginAmount = tirePricing.marginAmount;
      const minimumSalePrice = tirePricing.minimumSalePrice;

      const payload = {
        ...formData,
        publishStatus: finalStatus,
        keywords: keywordArray.join(';'),
        features: featureArray,
        faqs,
        tags: tagArray,
        alsoFoundIn: alsoFoundInArray,
        stock: parseInt(formData.stock) || 0,
        cost: Math.round(costNum * 100) / 100,
        internalShipping: Math.round(internalShippingNum * 100) / 100,
        processingCharges: processingChargesNum,
        margin: marginNum,
        processingAmount,
        netCost,
        marginAmount,
        minimumSalePrice,
        salePrice: Math.round(parseFloat(formData.salePrice) * 100) / 100 || 0,
        regularPrice: Math.round(parseFloat(formData.regularPrice) * 100) / 100 || 0,
        mapPrice: Math.round(parseFloat(formData.mapPrice) * 100) / 100 || 0,
        shippingCost: Math.round(parseFloat(formData.shippingCost) * 100) / 100 || 0,
        handlingFee: Math.round(parseFloat(formData.handlingFee) * 100) / 100 || 0,
        freightCharges: Math.round(parseFloat(formData.freightCharges) * 100) / 100 || 0,
        mileageScore: parseInt(formData.mileageScore) || 0,
        tractionScore: parseInt(formData.tractionScore) || 0,
        stabilityScore: parseInt(formData.stabilityScore) || 0,
        feedbackScore: parseInt(formData.feedbackScore) || 0,
        video: existingVideo,
        youtubeUrl: trimmedYoutube,
      };

      let submitData: any = payload;
      if (videoFile) {
        const multipartData = new FormData();
        multipartData.append('payload', JSON.stringify(payload));
        multipartData.append('video', videoFile);
        multipartData.append('existingVideo', existingVideo || '');
        multipartData.set('youtubeUrl', trimmedYoutube);
        submitData = multipartData;
      }

      if (editTireId) {
        await dispatch(updateTire({ id: editTireId, data: submitData })).unwrap();
        toast.success('Tire updated successfully');
      } else {
        await dispatch(createTire(submitData)).unwrap();
        toast.success('Tire created successfully');
      }

      router.push('/admin/tires');
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
        <p className="text-gray-400 font-medium animate-pulse">Loading tire data...</p>
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
          {editTireId ? 'Edit Tire' : 'Add New Tire'}
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
                <span className={`text-[16px] ${!formData.modelId ? 'text-gray-500' : 'font-medium'}`}>
                  {formData.modelId 
                    ? models.find(m => m.id === formData.modelId)?.modelName + (models.find(m => m.id === formData.modelId)?.brand ? ` (${models.find(m => m.id === formData.modelId)?.brand?.brandName})` : '')
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
                          className={`px-4 py-3 text-[16px] cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${formData.modelId === model.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`}
                          onClick={() => {
                            setFormData({ ...formData, modelId: model.id });
                            setIsDropdownOpen(false);
                            setModelSearch('');
                          }}
                        >
                          <span>{model.modelName} {model.brand && <span className="text-gray-400 font-normal text-xs ml-2">({model.brand.brandName})</span>}</span>
                          {formData.modelId === model.id && <Check className="h-4 w-4" />}
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
              {formData.tireSize && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Tire Size</label>}
              <input 
                type="text" 
                placeholder="Tire Size (e.g. 225/45R17)" 
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
                value={formData.tireSize} 
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, tireSize: value });
                  handleSizeChange(value);
                }}
                onBlur={(e) => handleSizeBlur(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.tireWidth && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Tire Width</label>}
              <input type="text" placeholder="Tire Width" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.tireWidth} onChange={(e) => setFormData({ ...formData, tireWidth: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.aspectRatio && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Aspect Ratio</label>}
              <input type="text" placeholder="Aspect Ratio" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.aspectRatio} onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.rimDiameter && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Rim Diameter</label>}
              <input type="text" placeholder="Rim Diameter" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.rimDiameter} onChange={(e) => setFormData({ ...formData, rimDiameter: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.loadIndex && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Load Index</label>}
              <input type="text" placeholder="Load Index" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.loadIndex} onChange={(e) => setFormData({ ...formData, loadIndex: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.speedRating && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Speed Rating</label>}
              <input type="text" placeholder="Speed Rating" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.speedRating} onChange={(e) => setFormData({ ...formData, speedRating: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.loadRange && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Load Range</label>}
              <input type="text" placeholder="Load Range" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.loadRange} onChange={(e) => setFormData({ ...formData, loadRange: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.inflationPressure && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Inflation Pressure</label>}
              <input type="text" placeholder="Inflation Pressure" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.inflationPressure} onChange={(e) => setFormData({ ...formData, inflationPressure: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.tireWeight && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Tire Weight</label>}
              <input type="text" placeholder="Tire Weight" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.tireWeight} onChange={(e) => setFormData({ ...formData, tireWeight: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.shippingDimensions && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Dimensions</label>}
              <input type="text" placeholder="Shipping Dimensions" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.shippingDimensions} onChange={(e) => setFormData({ ...formData, shippingDimensions: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.utqg && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">UTQG</label>}
              <input type="text" placeholder="UTQG" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.utqg} onChange={(e) => setFormData({ ...formData, utqg: e.target.value })} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Vehicle Type</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={formData.vehicleType} onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}>
                <option value="">Select Type</option>
                {vehicleTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Status</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Category</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={formData.sidewallCategory} onChange={(e) => setFormData({ ...formData, sidewallCategory: e.target.value })}>
                <option value="">Select Category</option>
                {sidewallCategoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              {formData.sidewallDetail && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Sidewall</label>}
              <input type="text" placeholder="Sidewall Details" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.sidewallDetail} onChange={(e) => setFormData({ ...formData, sidewallDetail: e.target.value })} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative w-full">
              {featureInput && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Features</label>}
              <input 
                type="text" 
                placeholder="Press Enter or : to add features" 
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" 
                value={featureInput} 
                onChange={(e) => setFeatureInput(e.target.value)} 
                onKeyDown={handleFeatureKeyDown}
                onFocus={() => setIsFeatureFocused(true)}
                onBlur={() => setTimeout(() => setIsFeatureFocused(false), 200)}
              />
              {isFeatureFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto">
                  {featureSuggestions.filter(s => s.toLowerCase().includes(featureInput.toLowerCase())).map(suggestion => (
                    <div 
                      key={suggestion} 
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-[14px] text-[#1e2a4a]"
                      onClick={() => addFeatureFromSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                  {featureSuggestions.filter(s => s.toLowerCase().includes(featureInput.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-[14px] text-gray-400">Press colon (:) or Enter to add custom feature</div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {featureArray.map(feat => (
                <span key={feat} className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-2 border border-purple-100">
                  {feat} <X className="h-3 w-3 cursor-pointer" onClick={() => removeFeature(feat)} />
                </span>
              ))}
            </div>
          </div>

          <ProductCommonFields
            sections={['seo']}
            wrapCards={false}
            seoCardTitle=""
            keywords={keywordArray}
            onKeywordsChange={setKeywordArray}
            seoTitle={formData.seoTitle}
            onSeoTitleChange={(v) => setFormData({ ...formData, seoTitle: v })}
            metaDescription={formData.metaDescription}
            onMetaDescriptionChange={(v) => setFormData({ ...formData, metaDescription: v })}
          />
        </div>

        <ProductCommonFields
          sections={['faqs']}
          keywords={keywordArray}
          onKeywordsChange={setKeywordArray}
          seoTitle={formData.seoTitle}
          onSeoTitleChange={(v) => setFormData({ ...formData, seoTitle: v })}
          metaDescription={formData.metaDescription}
          onMetaDescriptionChange={(v) => setFormData({ ...formData, metaDescription: v })}
          faqs={faqs}
          onFaqsChange={setFaqs}
          tags={tagArray}
          onTagsChange={setTagArray}
          alsoFoundIn={alsoFoundInArray}
          onAlsoFoundInChange={setAlsoFoundInArray}
        />

        {/* Product Videos */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Product Videos</h3>

          <div className="space-y-4">
            <h4 className="text-[15px] font-semibold text-gray-700">Upload Product Video</h4>
            <p className="text-sm text-gray-500">Optional. One video file (mp4, mov, or webm).</p>

            <div className="flex flex-wrap gap-4 items-start">
              <div className="w-[220px] h-[140px] border-2 border-dashed border-[#d1d5db] rounded-[24px] flex items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative shrink-0">
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleVideoChange}
                />
                <div className="flex flex-col items-center gap-1.5 px-3 text-center pointer-events-none">
                  <UploadCloud className="h-[22px] w-[22px] text-[#8c9bb1]" />
                  <span className="text-[#8c9bb1] font-medium text-[14px]">
                    {videoFile || existingVideo ? 'Replace Video' : 'Upload Video'}
                  </span>
                </div>
              </div>

              {videoFile && (
                <div className="relative rounded-[24px] overflow-hidden border border-gray-100 bg-black/5 w-[280px] shrink-0">
                  <video
                    src={URL.createObjectURL(videoFile)}
                    controls
                    className="w-full h-[140px] object-contain bg-black"
                  />
                  <div className="absolute top-2 left-2 right-10 px-2 py-1 rounded-lg bg-black/60 text-white text-xs truncate">
                    {videoFile.name}
                  </div>
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!videoFile && existingVideo && (
                <div className="relative rounded-[24px] overflow-hidden border border-gray-100 bg-black/5 w-[280px] shrink-0">
                  <video
                    src={getUploadUrl(existingVideo)}
                    controls
                    className="w-full h-[140px] object-contain bg-black"
                  />
                  <div className="absolute top-2 left-2 right-10 px-2 py-1 rounded-lg bg-black/60 text-white text-xs truncate">
                    {existingVideo}
                  </div>
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-50 pt-6 space-y-3">
            <h4 className="text-[15px] font-semibold text-gray-700">YouTube Video URL</h4>
            <p className="text-sm text-gray-500">Optional. Accepts youtube.com and youtu.be links.</p>
            <div>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=xxxxxxxx"
                className={`w-full px-4 py-3.5 bg-transparent border rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none ${
                  youtubeUrlError ? 'border-red-400' : 'border-gray-200'
                }`}
                value={formData.youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
              />
              {youtubeUrlError && (
                <p className="mt-1.5 text-sm text-red-500">{youtubeUrlError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Tire Specifications & Pricing */}
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center gap-4 px-4">
            <div className="h-px bg-gray-100 flex-1" />
            <h2 className="text-[18px] font-black text-black-300 uppercase tracking-[0.2em] whitespace-nowrap">Section 2: Tire Inventory & Pricing</h2>
            <div className="h-px bg-gray-100 flex-1" />
          </div>
          
          <TireFieldsSection 
            formData={formData}
            setFormData={setFormData}
            sources={sources}
            isSourceDropdownOpen={isSourceDropdownOpen}
            setIsSourceDropdownOpen={setIsSourceDropdownOpen}
            sourceDropdownRef={sourceDropdownRef}
            setIsManageSourcesOpen={setIsManageSourcesOpen}
            toggleSource={toggleSource}
            sourceInventories={sourceInventories}
            showStockCostDetails={Boolean(editTireId)}
          />

          <ProductCommonFields
            sections={['scores']}
            scoreFields={[
              { key: 'mileageScore', label: 'Mileage Score' },
              { key: 'stabilityScore', label: 'Stability Score' },
              { key: 'tractionScore', label: 'Traction Score' },
              { key: 'feedbackScore', label: 'Feedback Score' },
            ]}
            scores={{
              mileageScore: formData.mileageScore,
              stabilityScore: formData.stabilityScore,
              tractionScore: formData.tractionScore,
              feedbackScore: formData.feedbackScore,
            }}
            onScoreChange={(key, value) => setFormData({ ...formData, [key]: value })}
          />
        </div>

        <div className="flex justify-end items-center gap-4 pt-8">
          <button 
            type="button" 
            disabled={loading} 
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            className="px-8 py-4 bg-gray-100 text-[#1e2a4a] rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-3"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save as Draft'}
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-12 py-4 bg-[#1e2a4a] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-3"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editTireId ? 'Update Tire' : 'Save Tire')}
          </button>
        </div>
      </form>

      {isManageSourcesOpen && (
        <ManageInventorySourcesModal onClose={() => setIsManageSourcesOpen(false)} />
      )}
    </div>
  );
}
