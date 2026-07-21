'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createWheel, updateWheel } from '@/redux/slices/wheelsSlice';
import { fetchAllInventorySources } from '@/redux/slices/inventorySourcesSlice';
import { ArrowLeft, Loader2, UploadCloud, X, Settings2, Check, ChevronDown, Calculator, Plus } from 'lucide-react';
import { calculateTireNetCostPricing, calculateSaleMarkupPercentage, isSalePriceBelowRecommended } from '@/utils/pricing';
import axios from 'axios';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import ManageInventorySourcesModal from './ManageInventorySourcesModal';
import ManageBrandsModal from './ManageBrandsModal';
import StockCostDetailsTable from './StockCostDetailsTable';
import type { SourceInventoryRow } from '@/lib/sourceInventory';
import { useShippingAutoFill } from '@/hooks/useShippingAutoFill';
import {
  isAllowedWireWheelVideoFile,
  isValidYouTubeUrl,
} from '@/lib/youtube';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface WheelFormProps {
  editWheelId?: string;
  duplicateId?: string;
}

export default function WheelForm({ editWheelId, duplicateId }: WheelFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const editorConfig = React.useMemo(() => ({
    readonly: false,
    placeholder: editWheelId ? '' : 'Enter wheel description...',
    showPlaceholder: !editWheelId,
    toolbarButtonSize: 'middle' as const,
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'ul', 'ol', '|',
      'outdent', 'indent',  '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print', 'about'
    ],
    height: 400,
    uploader: { insertImageAsBase64URI: true },
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    width: '100%',
    spellcheck: true,
    language: 'en',
  }), [editWheelId, duplicateId]);

  const { sources } = useAppSelector((state) => state.inventorySources);

  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [brands, setBrands] = useState<{ id: string; brandName: string }[]>([]);
  
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [sourceInventories, setSourceInventories] = useState<SourceInventoryRow[]>([]);

  const [activeDuplicateId, setActiveDuplicateId] = useState<string | null>(duplicateId || null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !duplicateId) {
      const id = sessionStorage.getItem('duplicateWheelId');
      if (id) {
        setActiveDuplicateId(id);
        sessionStorage.removeItem('duplicateWheelId');
      }
    }
  }, [duplicateId]);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Product video (max 1) + optional YouTube URL
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [youtubeUrlError, setYoutubeUrlError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Keywords tag state
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

  const [formData, setFormData] = useState({
    sku: '',
    productName: '',
    brandId: '',
    brandVariant: '',
    displayStyleNo: '',
    finish: '',
    boltPatternInches: '',
    boltPatternMM: '',
    loadRatingKg: '',
    loadRatingLbs: '',
    offset: '',
    backSpacing: '',
    centerBore: '',
    shippingWeight: '',
    shippingDimensions: '',
    description: '',
    invOrderType: '',
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
    isFeatured: false,
    isVisible: true,
    isActive: true,
    category: 'wheel',
    status: 'draft',
    keywords: '',
    metaDescription: '',
    seoTitle: '',
    sourceIds: [] as string[],
    finishDurabilityScore: '',
    fitmentPrecisionScore: '',
    impactResistanceScore: '',
    feedbackScore: '',
    youtubeUrl: '',
  });

  const { handleSizeBlur, handleSizeChange } = useShippingAutoFill({
    category: 'WHEEL',
    weightField: 'shippingWeight',
    onApply: useCallback((fields) => {
      setFormData((prev) => ({ ...prev, ...fields }));
    }, []),
  });

  const fetchBrands = async () => {
    try {
      const brandsRes = await axios.get('/api/admin/brands/dropdown?category=wheel');
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchBrands();
        dispatch(fetchAllInventorySources());
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    const loadInitialData = async () => {
      const targetId = editWheelId || activeDuplicateId;
      if (!targetId) return;
      
      setFetching(true);
      try {
        const wheelRes = await axios.get(`/api/admin/wheels/${targetId}`);
        const wheel = wheelRes.data;
        
        setFormData({
          sku: activeDuplicateId ? '' : (wheel.sku || ''),
          productName: wheel.productName || '',
          brandId: wheel.brandId || '',
          brandVariant: wheel.brandVariant || '',
          displayStyleNo: wheel.displayStyleNo || '',
          finish: wheel.finish || '',
          wheelSize: wheel.wheelSize || '',
          modelName: wheel.modelName || '',
          style: wheel.style || '',
          alternatePartNumber: wheel.alternatePartNumber || '',
          upcNo: wheel.upcNo || '',
          lugCount: wheel.lugCount ? String(wheel.lugCount) : '',
          boltPatternInches: wheel.boltPatternInches || '',
          boltPatternMM: wheel.boltPatternMM || '',
          loadRatingKg: wheel.loadRatingKg || '',
          loadRatingLbs: wheel.loadRatingLbs || '',
          offset: wheel.offset || '',
          backSpacing: wheel.backSpacing ? String(wheel.backSpacing) : '',
          centerBore: wheel.centerBore || '',
          shippingWeight: wheel.shippingWeight || '',
          shippingDimensions: wheel.shippingDimensions || '',
          description: wheel.description || '',
          invOrderType: wheel.invOrderType || '',
          stock: String(wheel.stock || 0),
          cost: wheel.cost != null ? Number(wheel.cost).toFixed(2) : '0.00',
          internalShipping: wheel.internalShipping != null ? Number(wheel.internalShipping).toFixed(2) : '0',
          processingCharges: wheel.processingCharges != null ? String(wheel.processingCharges) : '0',
          margin: wheel.margin != null ? String(wheel.margin) : '0',
          salePrice: wheel.salePrice != null ? Number(wheel.salePrice).toFixed(2) : '0.00',
          regularPrice: wheel.regularPrice != null ? Number(wheel.regularPrice).toFixed(2) : '0.00',
          mapPrice: wheel.mapPrice != null ? Number(wheel.mapPrice).toFixed(2) : '0.00',
          shippingCost: wheel.shippingCost != null ? Number(wheel.shippingCost).toFixed(2) : '0.00',
          handlingFee: wheel.handlingFee != null ? Number(wheel.handlingFee).toFixed(2) : '0.00',
          isFeatured: !!wheel.isFeatured,
          isVisible: !!wheel.isVisible,
          isActive: wheel.isActive !== false,
          category: wheel.category || 'wheel',
          status: wheel.status || 'draft',
          keywords: wheel.keywords || '',
          metaDescription: wheel.metaDescription || '',
          seoTitle: wheel.seoTitle || '',
          sourceIds: wheel.sources?.map((s: any) => s.id) || [],
          finishDurabilityScore: wheel.finishDurabilityScore != null ? String(wheel.finishDurabilityScore) : '',
          fitmentPrecisionScore: wheel.fitmentPrecisionScore != null ? String(wheel.fitmentPrecisionScore) : '',
          impactResistanceScore: wheel.impactResistanceScore != null ? String(wheel.impactResistanceScore) : '',
          feedbackScore: wheel.feedbackScore != null ? String(wheel.feedbackScore) : '',
          youtubeUrl: wheel.youtubeUrl || '',
        });

        if (wheel.keywords) {
          setKeywordArray(wheel.keywords.split(';').filter(Boolean));
        }

        if (wheel.images && Array.isArray(wheel.images)) {
          setExistingImages(wheel.images);
        }

        setExistingVideo(wheel.video || null);
        setVideoFile(null);
        setSourceInventories(wheel.sourceInventories || []);
      } catch (error) {
        console.error('Error loading wheel data:', error);
        toast.error('Failed to load wheel data');
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, [editWheelId, activeDuplicateId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pricing = useMemo(() => {
    return calculateTireNetCostPricing(
      Number(formData.cost),
      Number(formData.internalShipping),
      Number(formData.processingCharges),
      Number(formData.margin)
    );
  }, [formData.cost, formData.internalShipping, formData.processingCharges, formData.margin]);

  const saleMarkupPercentage = useMemo(() => {
    return calculateSaleMarkupPercentage(Number(formData.salePrice), pricing.netCost);
  }, [formData.salePrice, pricing.netCost]);

  const processingChargesLabel = formData.processingCharges || '0';
  const marginLabel = formData.margin || '0';

  const toggleSource = (sourceId: string) => {
    setFormData(prev => {
      const isSelected = prev.sourceIds.includes(sourceId);
      if (isSelected) {
        return { ...prev, sourceIds: [] };
      } else {
        return { ...prev, sourceIds: [sourceId] };
      }
    });
    setIsSourceDropdownOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleBoltPatternInchesChange = (val: string) => {
    let mmVal = formData.boltPatternMM;
    if (val.includes('x') || val.includes('X')) {
      const parts = val.toLowerCase().split('x');
      if (parts.length === 2) {
        const inches = parseFloat(parts[1]);
        if (!isNaN(inches)) {
          const mm = (inches * 25.4).toFixed(2);
          mmVal = `${parts[0]}x${mm.endsWith('.00') ? mm.slice(0, -3) : mm}`;
        }
      }
    }
    setFormData({ ...formData, boltPatternInches: val, boltPatternMM: mmVal });
  };

  const handleLoadRatingKgChange = (val: string) => {
    let lbsVal = formData.loadRatingLbs;
    const kg = parseFloat(val);
    if (!isNaN(kg)) {
      lbsVal = Math.round(kg * 2.20462).toString();
    } else if (val === '') {
      lbsVal = '';
    }
    setFormData({ ...formData, loadRatingKg: val, loadRatingLbs: lbsVal });
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (img: string) => {
    setExistingImages(prev => prev.filter(i => i !== img));
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

  const getImageUrl = (path: string) => {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
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

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'published' | 'draft') => {
    e.preventDefault();
    const finalStatus = statusOverride || formData.status || 'published';

    if (finalStatus === 'published') {
      if (!formData.productName) return toast.error('Product Name is required');
      if (!formData.sku) return toast.error('SKU is required');
      if (!formData.wheelSize) return toast.error('Wheel Size is required');
      if (!formData.offset) return toast.error('Offset is required');
      if (!formData.sourceIds || formData.sourceIds.length === 0) return toast.error('Inventory Source is required');
      
      const stockNum = parseInt(formData.stock) || 0;
      const costNum = parseFloat(formData.cost) || 0;
      const saleNum = parseFloat(formData.salePrice) || 0;
      const mapNum = parseFloat(formData.mapPrice) || 0;
      const regularNum = parseFloat(formData.regularPrice) || 0;
      const tirePricing = calculateTireNetCostPricing(
        costNum,
        parseFloat(formData.internalShipping) || 0,
        parseFloat(formData.processingCharges) || 0,
        parseFloat(formData.margin) || 0
      );

      if (stockNum <= 0) return toast.error('Stock must be greater than 0');
      if (costNum <= 0) return toast.error('Cost Price is required');
      if (saleNum < 0) return toast.error('Sale price cannot be less than 0');
      if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
        return toast.error('Sale Price cannot be lower than the Recommended Sale Price.');
      }
      if (regularNum > 0 && regularNum <= saleNum) return toast.error('Regular price must be greater than sale price');
      if (mapNum > 0 && saleNum < mapNum) return toast.error('Sale price must be >= MAP price');
    }

    const trimmedYoutube = (formData.youtubeUrl || '').trim();
    if (trimmedYoutube && !isValidYouTubeUrl(trimmedYoutube)) {
      setYoutubeUrlError('Please enter a valid YouTube Video URL');
      return toast.error('Please enter a valid YouTube Video URL');
    }

    if (finalStatus === 'draft') {
      setDraftLoading(true);
    } else {
      setPublishLoading(true);
    }
    try {
      const costNum = parseFloat(formData.cost) || 0;
      const tirePricing = calculateTireNetCostPricing(
        costNum,
        parseFloat(formData.internalShipping) || 0,
        parseFloat(formData.processingCharges) || 0,
        parseFloat(formData.margin) || 0
      );

      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'sourceIds') {
          submitData.append(key, JSON.stringify(value));
        } else if (key === 'keywords') {
          submitData.append(key, keywordArray.join(';'));
        } else if (typeof value === 'boolean') {
          submitData.append(key, value.toString());
        } else {
          submitData.append(key, String(value || ''));
        }
      });

      submitData.set('processingAmount', String(tirePricing.processingAmount));
      submitData.set('marginAmount', String(tirePricing.marginAmount));
      submitData.set('netCost', String(tirePricing.netCost));
      submitData.set('minimumSalePrice', String(tirePricing.minimumSalePrice));
      submitData.set('status', finalStatus);

      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      if (existingImages.length > 0) {
        submitData.append('existingImages', JSON.stringify(existingImages));
      }

      if (videoFile) {
        submitData.append('video', videoFile);
      }
      submitData.append('existingVideo', existingVideo || '');
      submitData.set('youtubeUrl', trimmedYoutube);

      if (editWheelId) {
        await dispatch(updateWheel({ id: editWheelId, data: submitData })).unwrap();
        toast.success('Wheel updated successfully');
      } else {
        await dispatch(createWheel(submitData)).unwrap();
        toast.success('Wheel created successfully');
      }

      router.push('/admin/wheels');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save data');
    } finally {
      if (finalStatus === 'draft') {
        setDraftLoading(false);
      } else {
        setPublishLoading(false);
      }
    }
  };

  if (fetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#1e2a4a] animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Loading wheel data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e2a4a]">
          {editWheelId ? 'Edit Wheel' : 'Add New Wheel'}
        </h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-12">
        {/* Section 1: Media Upload */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Images</h3>
          
          <div className="flex flex-wrap gap-4">
            {/* Add Images Box */}
            <div className="w-[140px] h-[140px] border-2 border-dashed border-[#d1d5db] rounded-[24px] flex items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative flex-shrink-0">
              <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} />
              <div className="flex items-center gap-1.5">
                <UploadCloud className="h-[22px] w-[22px] text-[#8c9bb1]" />
                <span className="text-[#8c9bb1] font-medium text-[15px]">Add Images</span>
              </div>
            </div>

            {/* Existing Images */}
            {existingImages.map((img, idx) => (
              <div key={`existing-${idx}`} className="w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border border-gray-100 group flex-shrink-0">
                <img src={getImageUrl(img)} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeExistingImage(img)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* New Images */}
            {imageFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border border-gray-100 group flex-shrink-0">
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

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
                <div className="flex flex-col items-center gap-1.5 px-3 text-center">
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
                    src={getImageUrl(existingVideo)}
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

        {/* Section 2: Basic Information */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          {/* Active / Featured Checkboxes */}
          <div className="flex items-center justify-end gap-6 pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-[18px] h-[18px] rounded-[4px] border border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer outline-none"
              />
              <span className="text-[15px] font-medium text-[#1e2a4a]">Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-[18px] h-[18px] rounded-[4px] border border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer outline-none"
              />
              <span className="text-[15px] font-medium text-[#1e2a4a]">Featured</span>
            </label>
          </div>

          <div className="relative w-full">
            {formData.productName && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Product Name</label>}
            <input type="text" placeholder="Product Name" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} required />
          </div>

          <div className="space-y-4">
            <label className="text-[14px] font-bold text-[#1e2a4a]">Description</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <JoditEditor
                value={formData.description}
                config={editorConfig}
                onBlur={(newContent) => setFormData({ ...formData, description: newContent })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-50">
            <div className="relative w-full">
              {formData.sku && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">SKU</label>}
              <input type="text" placeholder="SKU" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
            </div>
            <div className="relative w-full" ref={brandDropdownRef}>
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Brand</label>
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[16px] outline-none text-left flex items-center justify-between"
              >
                <span className={formData.brandId ? 'text-[#1e2a4a]' : 'text-gray-400'}>
                  {formData.brandId ? brands.find(b => b.id === formData.brandId)?.brandName || 'Select Brand' : 'Select Brand'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isBrandDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 flex flex-col max-h-[260px] overflow-hidden">
                  <div className="overflow-y-auto flex-1">
                    <div
                      onClick={() => { setFormData({ ...formData, brandId: '' }); setIsBrandDropdownOpen(false); }}
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-gray-50 text-[15px] ${
                        !formData.brandId ? 'text-blue-600 font-medium' : 'text-gray-400'
                      }`}
                    >
                      Select Brand
                      {!formData.brandId && <Check className="h-4 w-4 text-blue-600" />}
                    </div>
                    {brands.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => { setFormData({ ...formData, brandId: b.id }); setIsBrandDropdownOpen(false); }}
                        className={`px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-gray-50 text-[15px] ${
                          formData.brandId === b.id ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-[#1e2a4a]'
                        }`}
                      >
                        {b.brandName}
                        {formData.brandId === b.id && <Check className="h-4 w-4 text-blue-600" />}
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 bg-white sticky bottom-0 z-10 shrink-0">
                    <div
                      onClick={() => { setIsBrandDropdownOpen(false); setIsManageBrandsOpen(true); }}
                      className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-blue-50 text-[15px] text-[#3B5998] font-bold transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Brand
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative w-full">
              {formData.brandVariant && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Brand Variant</label>}
              <input type="text" placeholder="Brand Variant" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.brandVariant} onChange={(e) => setFormData({ ...formData, brandVariant: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.alternatePartNumber && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Alternate Part Number</label>}
              <input type="text" placeholder="Alternate Part Number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.alternatePartNumber} onChange={(e) => setFormData({ ...formData, alternatePartNumber: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.upcNo && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">UPC Number</label>}
              <input type="text" placeholder="UPC Number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.upcNo} onChange={(e) => setFormData({ ...formData, upcNo: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 3: Source Stock & Cost */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Source Stock & Cost</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full" ref={sourceDropdownRef}>
              <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-[14px] font-medium text-gray-400 uppercase tracking-wider">Select a Source</label>
                <button type="button" onClick={() => setIsManageSourcesOpen(true)} className="text-blue-500 hover:text-blue-600 text-[14px] font-bold flex items-center gap-1 transition-colors">
                  <Settings2 className="h-3.5 w-3.5" /> Manage
                </button>
              </div>
              <div className={`w-full px-4 py-3.5 bg-transparent border ${isSourceDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-200'} rounded-xl text-[#1e2a4a] cursor-pointer flex items-center justify-between transition-all min-h-[54px]`} onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}>
                <div className="flex flex-wrap gap-2 text-[16px]">
                  {formData.sourceIds.length > 0 ? (
                    formData.sourceIds.map(id => {
                      const source = sources?.find((s: any) => s.id === id);
                      return (
                        <span key={id} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[13px] font-bold flex items-center gap-1">
                          {source?.source || 'Unknown'}
                          <X className="h-3 w-3 hover:text-blue-800" onClick={(e) => { e.stopPropagation(); toggleSource(id); }} />
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-gray-500">Select a Source</span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {isSourceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {sources && sources.length > 0 ? (
                    sources.map((source: any) => (
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
            
            <div className="relative w-full mt-[28px]">
              {formData.stock && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Stock</label>}
              <input type="number" placeholder="Stock" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
            </div>
          </div>

        </div>
        {/* Section 5: Wheel Details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Wheel Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.finish && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Finish</label>}
              <input type="text" placeholder="Finish" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.finish} onChange={(e) => setFormData({ ...formData, finish: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.wheelSize && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Wheel Size</label>}
              <input type="text" placeholder="Wheel Size" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.wheelSize} onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, wheelSize: value });
                handleSizeChange(value);
              }} onBlur={(e) => handleSizeBlur(e.target.value)} required />
            </div>
            <div className="relative w-full">
              {formData.style && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Wheel Style</label>}
              <input type="text" placeholder="Wheel Style" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.style} onChange={(e) => setFormData({ ...formData, style: e.target.value })} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.centerBore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Center Bore</label>}
              <input type="text" placeholder="Center Bore" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.centerBore} onChange={(e) => setFormData({ ...formData, centerBore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.boltPatternInches && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Bolt Pattern (Inches)</label>}
              <input type="text" placeholder="Bolt Pattern (Inches) e.g. 5x4.75" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.boltPatternInches} onChange={(e) => handleBoltPatternInchesChange(e.target.value)} />
            </div>
            <div className="relative w-full">
              {formData.boltPatternMM && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Bolt Pattern (MM)</label>}
              <input type="text" placeholder="Bolt Pattern (MM) e.g. 5x120.65" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.boltPatternMM} onChange={(e) => setFormData({ ...formData, boltPatternMM: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.shippingWeight && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Weight</label>}
              <input type="text" placeholder="Shipping Weight" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.shippingWeight} onChange={(e) => setFormData({ ...formData, shippingWeight: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.shippingDimensions && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Dimensions</label>}
              <input type="text" placeholder="Shipping Dimensions" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.shippingDimensions} onChange={(e) => setFormData({ ...formData, shippingDimensions: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.lugCount && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Lug Count</label>}
              <input type="number" placeholder="Lug Count" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.lugCount} onChange={(e) => setFormData({ ...formData, lugCount: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 4: Pricing Details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Pricing Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              {formData.cost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Cost ($)</label>}
              <input type="number" placeholder="Cost ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold text-blue-600" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="relative w-full">
              {formData.internalShipping && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Internal Shipping ($)</label>}
              <input type="number" placeholder="Internal Shipping ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.internalShipping} onChange={(e) => setFormData({ ...formData, internalShipping: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.processingCharges && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Processing Charges (%)</label>}
              <input type="number" placeholder="Processing Charges (%)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.processingCharges} onChange={(e) => setFormData({ ...formData, processingCharges: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Processing Amount ($)</label>
              <input type="text" readOnly value={`$${pricing.processingAmount.toFixed(2)}`} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold cursor-not-allowed" />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Net Cost ($)</label>
              <input type="text" readOnly value={`$${pricing.netCost.toFixed(2)}`} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.margin && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Margin (%)</label>}
              <input type="number" placeholder="Margin (%)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.margin} onChange={(e) => setFormData({ ...formData, margin: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Margin Amount ($)</label>
              <input type="text" readOnly value={`$${pricing.marginAmount.toFixed(2)}`} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold cursor-not-allowed" />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Minimum Sale Price ($)</label>
              <input type="text" readOnly value={`$${pricing.minimumSalePrice.toFixed(2)}`} className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold cursor-not-allowed" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.salePrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Sale Price ($)</label>}
              <input type="number" placeholder="Sale Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold text-green-600" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
              <p className="mt-1 text-[13px] font-medium text-orange-500 italic">
                Recommended Sale Price: ${pricing.minimumSalePrice.toFixed(2)}
              </p>
              {Number(formData.salePrice) > 0 && isSalePriceBelowRecommended(Number(formData.salePrice), pricing.minimumSalePrice) && (
                <p className="mt-1 text-[13px] font-medium text-red-500">
                  Sale Price cannot be lower than the Recommended Sale Price.
                </p>
              )}
              {saleMarkupPercentage && (
                <div className={`mt-1 text-[11px] font-bold uppercase tracking-wider ${parseFloat(saleMarkupPercentage) < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                  Markup: {saleMarkupPercentage}%
                </div>
              )}
            </div>
            <div className="relative w-full">
              {formData.mapPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">MAP Price ($)</label>}
              <input type="number" placeholder="MAP Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.mapPrice} onChange={(e) => setFormData({ ...formData, mapPrice: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="relative w-full">
              {formData.regularPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Regular Price ($)</label>}
              <input type="number" placeholder="Regular Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.regularPrice} onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              {formData.shippingCost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Cost ($)</label>}
              <input type="number" placeholder="Shipping Cost ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
            <div className="relative w-full">
              {formData.handlingFee && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Handling Fee ($)</label>}
              <input type="number" placeholder="Handling Fee ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.handlingFee} onChange={(e) => setFormData({ ...formData, handlingFee: e.target.value })} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>

          {editWheelId && sourceInventories.length > 0 && (
            <StockCostDetailsTable rows={sourceInventories} stockZeroAsNA />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Calculator className="h-3 w-3" /> Processing Amount ({processingChargesLabel}%)
              </p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.processingAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Cost</p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.netCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Margin Amount ({marginLabel}%)</p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.marginAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-1">Minimum Sale Price</p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.minimumSalePrice.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Section 6: Features */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.loadRatingKg && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Load Rating (Kg)</label>}
              <input type="number" placeholder="Load Rating (Kg)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.loadRatingKg} onChange={(e) => handleLoadRatingKgChange(e.target.value)} />
            </div>
            <div className="relative w-full">
              {formData.loadRatingLbs && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Load Rating (Lbs)</label>}
              <input type="number" placeholder="Load Rating (Lbs)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.loadRatingLbs} onChange={(e) => setFormData({ ...formData, loadRatingLbs: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.offset && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Offset</label>}
              <input type="text" placeholder="Offset" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.offset} onChange={(e) => setFormData({ ...formData, offset: e.target.value })} required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              {formData.backSpacing && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Back Spacing</label>}
              <input type="text" placeholder="Back Spacing" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.backSpacing} onChange={(e) => setFormData({ ...formData, backSpacing: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 7: Additional Information */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Additional Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              {formData.displayStyleNo && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Style Number</label>}
              <input type="text" placeholder="Style Number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.displayStyleNo} onChange={(e) => setFormData({ ...formData, displayStyleNo: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.invOrderType && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Order Type</label>}
              <input type="text" placeholder="Order Type" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.invOrderType} onChange={(e) => setFormData({ ...formData, invOrderType: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 8: SEO */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="relative w-full">
                {keywordInput && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Keywords</label>}
                <input
                  type="text"
                  placeholder="Press Enter or ; to add keywords"
                  className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                />
              </div>
              {keywordArray.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keywordArray.map(kw => (
                    <span key={kw} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[13px] font-bold flex items-center gap-2 border border-blue-100">
                      {kw} <X className="h-3 w-3 cursor-pointer hover:text-blue-800" onClick={() => removeKeyword(kw)} />
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="relative w-full mt-4">
              {formData.seoTitle && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">SEO Title</label>}
              <input type="text" placeholder="SEO Title" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.seoTitle} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} />
            </div>
            <div className="relative w-full mt-4">
              {formData.metaDescription && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Meta Description</label>}
              <textarea placeholder="Meta Description" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none min-h-[100px] resize-y" value={formData.metaDescription} onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Section 9: Sky Wheel Score + Status */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Sky Score (0-10)</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative w-full">
              {formData.finishDurabilityScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Finish Durability Score</label>}
              <input type="number" min="0" max="10" placeholder="Finish Durability Score" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.finishDurabilityScore} onChange={(e) => setFormData({ ...formData, finishDurabilityScore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.impactResistanceScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Impact Resistance Score</label>}
              <input type="number" min="0" max="10" placeholder="Impact Resistance Score" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.impactResistanceScore} onChange={(e) => setFormData({ ...formData, impactResistanceScore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.fitmentPrecisionScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Fitment Precision Score</label>}
              <input type="number" min="0" max="10" placeholder="Fitment Precision Score" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.fitmentPrecisionScore} onChange={(e) => setFormData({ ...formData, fitmentPrecisionScore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.feedbackScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Feedback Score</label>}
              <input type="number" min="0" max="10" placeholder="Feedback Score" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.feedbackScore} onChange={(e) => setFormData({ ...formData, feedbackScore: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 pt-8">
          <button 
            type="button" 
            disabled={draftLoading || publishLoading} 
            onClick={(e) => handleSubmit(e, 'draft')}
            className="px-8 py-4 bg-gray-100 text-[#1e2a4a] rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {draftLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save as Draft'}
          </button>
          <button 
            type="submit" 
            disabled={draftLoading || publishLoading} 
            className="px-12 py-4 bg-[#1e2a4a] text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editWheelId ? 'Update Wheel' : 'Save Wheel')}
          </button>
        </div>
      </form>

      {isManageSourcesOpen && (
        <ManageInventorySourcesModal
          onClose={() => setIsManageSourcesOpen(false)}
        />
      )}

      {isManageBrandsOpen && (
        <ManageBrandsModal
          category="wheel"
          onClose={() => setIsManageBrandsOpen(false)}
          onBrandsUpdated={fetchBrands}
        />
      )}
    </div>
  );
}
