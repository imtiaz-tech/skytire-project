'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createAccessory, updateAccessory } from '@/features/accessories/slice';
import { fetchAllInventorySources } from '@/redux/slices/inventorySourcesSlice';
import {
  ArrowLeft, Loader2, UploadCloud, X, Calculator, ChevronDown, Check, Settings2, Plus,
} from 'lucide-react';
import { calculateTireNetCostPricing, calculateSaleMarkupPercentage, isSalePriceBelowRecommended } from '@/utils/pricing';
import axios from 'axios';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import ManageInventorySourcesModal from './ManageInventorySourcesModal';
import ManageBrandsModal from './ManageBrandsModal';
import { SPECIFICATION_FIELDS } from '@/constants/accessoryCategories';
import { AccessorySpecifications } from '@/redux/types/accessoryTypes';
import { useAccessoryShippingAutoFill } from '@/hooks/useShippingAutoFill';
import { fetchAccessoryCategories } from '@/features/accessory-categories/slice';
import ManageAccessoryCategoriesModal from './ManageAccessoryCategoriesModal';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface AccessoryFormProps {
  editAccessoryId?: string;
  duplicateId?: string;
}

const emptySpecs = (): AccessorySpecifications =>
  Object.fromEntries(SPECIFICATION_FIELDS.map((f) => [f.key, '']));

export default function AccessoryForm({ editAccessoryId, duplicateId }: AccessoryFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { sources } = useAppSelector((state) => state.inventorySources);

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: editAccessoryId ? '' : 'Enter accessory description...',
    showPlaceholder: !editAccessoryId,
    toolbarButtonSize: 'middle' as const,
    buttons: [
      'source', '|',
      'bold', 'strikethrough', 'underline', 'italic', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'image', 'video', 'table', 'link', '|',
      'align', 'undo', 'redo', '|',
      'hr', 'eraser', 'copyformat', '|',
      'symbol', 'fullsize', 'print', 'about',
    ],
    height: 400,
    uploader: { insertImageAsBase64URI: true },
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: 'insert_clear_html',
    width: '100%',
    spellcheck: true,
    language: 'en',
  }), [editAccessoryId]);

  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [brands, setBrands] = useState<{ id: string; brandName: string }[]>([]);
  const [activeDuplicateId, setActiveDuplicateId] = useState<string | null>(duplicateId || null);

  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  const { categories: accessoryCategories } = useAppSelector((state) => state.accessoryCategories);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [leftImageFile, setLeftImageFile] = useState<File | null>(null);
  const [rightImageFile, setRightImageFile] = useState<File | null>(null);
  const [existingLeftImage, setExistingLeftImage] = useState<string | null>(null);
  const [existingRightImage, setExistingRightImage] = useState<string | null>(null);

  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [specifications, setSpecifications] = useState<AccessorySpecifications>(emptySpecs());

  const [formData, setFormData] = useState({
    sku: '',
    productName: '',
    brandId: '',
    category: '',
    description: '',
    sourceId: '',
    stock: '0',
    cost: '0',
    internalShipping: '0',
    processingCharges: '0',
    margin: '0',
    salePrice: '0',
    regularPrice: '',
    mapPrice: '',
    shippingCost: '0',
    handlingFee: '0',
    packageInclude: '',
    seoTitle: '',
    metaDescription: '',
    materialHardnessScore: '',
    threadPrecisionScore: '',
    torqueRetentionScore: '',
    feedbackScore: '',
    isVisible: true,
    isFeatured: false,
    status: 'draft',
  });

  const { handleCategorySelect } = useAccessoryShippingAutoFill({
    onApplySpecs: useCallback((fields) => {
      setSpecifications((prev) => ({
        ...prev,
        weight: fields.weight,
        shippingDimensions: fields.shippingDimensions,
      }));
    }, []),
    onApplyInternalShipping: useCallback((value) => {
      setFormData((prev) => ({ ...prev, internalShipping: value }));
    }, []),
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && !duplicateId) {
      const id = sessionStorage.getItem('duplicateAccessoryId');
      if (id) {
        setActiveDuplicateId(id);
        sessionStorage.removeItem('duplicateAccessoryId');
      }
    }
  }, [duplicateId]);

  const fetchBrandsData = async () => {
    try {
      const brandsRes = await axios.get('/api/admin/brands/dropdown?category=accessory');
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  useEffect(() => {
    fetchBrandsData();
    dispatch(fetchAllInventorySources());
    dispatch(fetchAccessoryCategories());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node)) {
        setIsSourceDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(e.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadId = editAccessoryId || activeDuplicateId;
    if (!loadId) return;

    const loadData = async () => {
      setFetching(true);
      try {
        const res = await axios.get(`/api/admin/accessories/${loadId}`);
        const item = res.data;

        setFormData({
          sku: activeDuplicateId ? '' : item.sku || '',
          productName: item.productName || '',
          brandId: item.brandId || '',
          category: item.category || '',
          description: item.description || '',
          sourceId: item.sourceId || '',
          stock: String(item.stock ?? 0),
          cost: item.cost != null ? Number(item.cost).toFixed(2) : '1',
          internalShipping: item.internalShipping != null ? Number(item.internalShipping).toFixed(2) : '0',
          processingCharges: item.processingCharges != null ? String(item.processingCharges) : '0',
          margin: item.margin != null ? String(item.margin) : '0',
          salePrice: item.salePrice != null ? Number(item.salePrice).toFixed(2) : '1',
          regularPrice: item.regularPrice != null ? String(item.regularPrice) : '',
          mapPrice: item.mapPrice != null ? String(item.mapPrice) : '',
          shippingCost: String(item.shippingCost ?? 0),
          handlingFee: String(item.handlingFee ?? 0),
          packageInclude: item.packageInclude || '',
          seoTitle: item.seoTitle || '',
          metaDescription: item.metaDescription || '',
          materialHardnessScore: item.materialHardnessScore != null ? String(item.materialHardnessScore) : '',
          threadPrecisionScore: item.threadPrecisionScore != null ? String(item.threadPrecisionScore) : '',
          torqueRetentionScore: item.torqueRetentionScore != null ? String(item.torqueRetentionScore) : '',
          feedbackScore: item.feedbackScore != null ? String(item.feedbackScore) : '',
          isVisible: item.isVisible ?? true,
          isFeatured: item.isFeatured ?? false,
          status: activeDuplicateId ? 'draft' : item.status || 'draft',
        });

        setExistingImages(item.images || []);
        setExistingLeftImage(item.leftImage || null);
        setExistingRightImage(item.rightImage || null);

        if (item.keywords) {
          setKeywordArray(item.keywords.split(';').map((k: string) => k.trim()).filter(Boolean));
        }

        if (item.specifications && typeof item.specifications === 'object') {
          setSpecifications({ ...emptySpecs(), ...(item.specifications as AccessorySpecifications) });
        }
      } catch {
        toast.error('Failed to load accessory data');
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [editAccessoryId, activeDuplicateId]);

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

  const getImageUrl = (path: string) => {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  const toggleSource = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      sourceId: prev.sourceId === id ? '' : id,
    }));
    setIsSourceDropdownOpen(false);
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const updateSpec = (key: string, value: string) => {
    setSpecifications((prev) => ({ ...prev, [key]: value }));
  };

  const validatePublish = () => {
    if (!formData.productName) return toast.error('Product Name is required');
    if (!formData.sku) return toast.error('SKU is required');
    if (!formData.category) return toast.error('Accessory Category is required');
    if (!formData.brandId) return toast.error('Brand is required');
    if (!formData.sourceId) return toast.error('Inventory Source is required');

    const stockNum = parseInt(formData.stock) || 0;
    const costNum = parseFloat(formData.cost) || 0;
    const saleNum = parseFloat(formData.salePrice) || 0;
    const mapNum = parseFloat(formData.mapPrice) || 0;
    const tirePricing = calculateTireNetCostPricing(
      costNum,
      parseFloat(formData.internalShipping) || 0,
      parseFloat(formData.processingCharges) || 0,
      parseFloat(formData.margin) || 0
    );

    if (stockNum <= 0) return toast.error('Stock must be greater than 0');
    if (costNum <= 0) return toast.error('Cost is required');
    if (saleNum <= 0) return toast.error('Sale Price is required');
    if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
      return toast.error('Sale Price cannot be lower than the Recommended Sale Price.');
    }
    if (mapNum > 0 && saleNum < mapNum) return toast.error('Sale price must be greater than or equal to MAP price');

    const totalImages = existingImages.length + imageFiles.length;
    if (totalImages === 0) return toast.error('At least one image is required to publish');

    const scores = [
      { val: formData.materialHardnessScore, label: 'Material Hardness Score' },
      { val: formData.threadPrecisionScore, label: 'Thread Precision Score' },
      { val: formData.torqueRetentionScore, label: 'Torque Retention Score' },
      { val: formData.feedbackScore, label: 'Feedback Score' },
    ];
    for (const s of scores) {
      if (s.val !== '' && s.val != null) {
        const n = parseInt(s.val);
        if (n < 0 || n > 10) return toast.error(`${s.label} must be between 0 and 10`);
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'published' | 'draft') => {
    e.preventDefault();
    const finalStatus = statusOverride || formData.status || 'published';

    if (finalStatus === 'published' && validatePublish() !== true) return;

    if (finalStatus === 'draft') setDraftLoading(true);
    else setPublishLoading(true);

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
        if (typeof value === 'boolean') {
          submitData.append(key, value.toString());
        } else {
          submitData.append(key, String(value ?? ''));
        }
      });
      submitData.set('processingAmount', String(tirePricing.processingAmount));
      submitData.set('marginAmount', String(tirePricing.marginAmount));
      submitData.set('netCost', String(tirePricing.netCost));
      submitData.set('minimumSalePrice', String(tirePricing.minimumSalePrice));
      submitData.set('status', finalStatus);
      submitData.append('keywords', keywordArray.join(';'));
      submitData.append('specifications', JSON.stringify(specifications));

      imageFiles.forEach((file) => submitData.append('images', file));
      if (existingImages.length > 0) {
        submitData.append('existingImages', JSON.stringify(existingImages));
      }

      if (leftImageFile) submitData.append('leftImage', leftImageFile);
      if (rightImageFile) submitData.append('rightImage', rightImageFile);
      if (existingLeftImage && !leftImageFile) submitData.append('existingLeftImage', existingLeftImage);
      if (existingRightImage && !rightImageFile) submitData.append('existingRightImage', existingRightImage);
      if (editAccessoryId && !leftImageFile && !existingLeftImage) {
        submitData.append('removeLeftImage', 'true');
      }
      if (editAccessoryId && !rightImageFile && !existingRightImage) {
        submitData.append('removeRightImage', 'true');
      }

      if (editAccessoryId) {
        await dispatch(updateAccessory({ id: editAccessoryId, data: submitData })).unwrap();
        toast.success(finalStatus === 'draft' ? 'Accessory saved as draft' : 'Accessory updated successfully');
      } else {
        await dispatch(createAccessory(submitData)).unwrap();
        toast.success(finalStatus === 'draft' ? 'Accessory saved as draft' : 'Accessory published successfully');
      }
      router.push('/admin/accessories');
    } catch (error: unknown) {
      const err = error as string;
      toast.error(typeof err === 'string' ? err : 'Failed to save accessory');
    } finally {
      setDraftLoading(false);
      setPublishLoading(false);
    }
  };

  const FloatingLabelField = ({
    label,
    value,
    onChange,
    type = 'text',
    rows,
    min,
    max,
  }: {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    type?: string;
    rows?: number;
    min?: number;
    max?: number;
  }) => (
    <div className="relative w-full">
      {value && (
        <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">
          {label}
        </label>
      )}
      {rows ? (
        <textarea
          placeholder={label}
          rows={rows}
          className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none resize-none"
          value={value}
          onChange={onChange}
        />
      ) : (
        <input
          type={type}
          placeholder={label}
          min={min}
          max={max}
          className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none"
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );

  const ImageUploadZone = ({
    label,
    buttonText,
    multiple = false,
    preview,
    onChange,
    onRemove,
  }: {
    label: string;
    buttonText: string;
    multiple?: boolean;
    preview?: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove?: () => void;
  }) => (
    <div className="space-y-3">
      <h3 className="text-[18px] font-bold text-[#1e2a4a]">{label}</h3>
      <div className="relative w-[140px] h-[140px] shrink-0">
        {preview ? (
          <div className="relative w-full h-full rounded-[24px] overflow-hidden border border-gray-100 bg-white">
            <img src={preview} alt={label} className="w-full h-full object-contain" />
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-full h-full border-2 border-dashed border-[#d1d5db] rounded-[24px] flex items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative">
            <input
              type="file"
              accept="image/*"
              multiple={multiple}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={onChange}
            />
            <div className="flex items-center gap-1.5 pointer-events-none">
              <UploadCloud className="h-[22px] w-[22px] text-[#8c9bb1]" />
              <span className="text-[#8c9bb1] font-medium text-[15px]">{buttonText}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e2a4a]">
          {editAccessoryId ? 'Edit Accessory' : 'Add Accessory'}
        </h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-6">
        {/* Images */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-3">
            <h3 className="text-[18px] font-bold text-[#1e2a4a]">Additional Images</h3>
            {(existingImages.length > 0 || imageFiles.length > 0) && (
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img) => (
                  <div key={img} className="w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border border-gray-100 group shrink-0 bg-white">
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setExistingImages((prev) => prev.filter((i) => i !== img))} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {imageFiles.map((file, idx) => (
                  <div key={idx} className="w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border border-gray-100 group shrink-0 bg-white">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-contain" />
                    <button type="button" onClick={() => setImageFiles((prev) => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="w-[140px] h-[140px] border-2 border-dashed border-[#d1d5db] rounded-[24px] flex items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative shrink-0">
              <input
                type="file"
                accept="image/*"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => { if (e.target.files) setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]); }}
              />
              <div className="flex items-center gap-1.5 pointer-events-none">
                <UploadCloud className="h-[22px] w-[22px] text-[#8c9bb1]" />
                <span className="text-[#8c9bb1] font-medium text-[15px]">Add Images</span>
              </div>
            </div>
          </div>

          <ImageUploadZone
            label="Left Side Image"
            buttonText="Add Image"
            preview={leftImageFile ? URL.createObjectURL(leftImageFile) : existingLeftImage ? getImageUrl(existingLeftImage) : null}
            onChange={(e) => {
              if (e.target.files?.[0]) setLeftImageFile(e.target.files[0]);
              e.target.value = '';
            }}
            onRemove={() => {
              setLeftImageFile(null);
              setExistingLeftImage(null);
            }}
          />

          <ImageUploadZone
            label="Right Side Image"
            buttonText="Add Image"
            preview={rightImageFile ? URL.createObjectURL(rightImageFile) : existingRightImage ? getImageUrl(existingRightImage) : null}
            onChange={(e) => {
              if (e.target.files?.[0]) setRightImageFile(e.target.files[0]);
              e.target.value = '';
            }}
            onRemove={() => {
              setRightImageFile(null);
              setExistingRightImage(null);
            }}
          />
        </div>
        {/* Basic Information */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center justify-end gap-6 pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-[18px] h-[18px] rounded-[4px] border border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer outline-none"
              />
              <span className="text-[15px] font-medium text-[#1e2a4a]">Visible</span>
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
            {formData.productName && (
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Product Name</label>
            )}
            <input
              type="text"
              placeholder="Product Name"
              className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[14px] font-bold text-[#1e2a4a]">Description</label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <JoditEditor
                value={formData.description}
                config={editorConfig}
                onBlur={(content) => setFormData({ ...formData, description: content })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
            <div className="relative w-full">
              {formData.sku && (
                <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">SKU</label>
              )}
              <input
                type="text"
                placeholder="SKU"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="relative w-full" ref={brandDropdownRef}>
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Brand</label>
              <button
                type="button"
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[16px] outline-none text-left flex items-center justify-between"
              >
                <span className={formData.brandId ? 'text-[#1e2a4a]' : 'text-gray-400'}>
                  {formData.brandId ? brands.find((b) => b.id === formData.brandId)?.brandName || 'Select Brand' : 'Select Brand'}
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
            <div className="relative w-full" ref={categoryDropdownRef}>
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Accessory Category</label>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[16px] outline-none text-left flex items-center justify-between"
              >
                <span className={formData.category ? 'text-[#1e2a4a]' : 'text-gray-400'}>
                  {formData.category || 'Select Category'}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                  {accessoryCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setFormData({ ...formData, category: cat.name });
                        setIsCategoryDropdownOpen(false);
                        handleCategorySelect(cat.name);
                      }}
                      className={`px-4 py-2.5 cursor-pointer flex items-center justify-between hover:bg-gray-50 text-[15px] ${
                        formData.category === cat.name ? 'text-blue-600 font-medium bg-blue-50/50' : 'text-[#1e2a4a]'
                      }`}
                    >
                      {cat.name}
                      {formData.category === cat.name && <Check className="h-4 w-4 text-blue-600" />}
                    </div>
                  ))}
                  <div className="border-t border-gray-100 bg-white sticky bottom-0 z-10 shrink-0">
                    <div
                      onClick={() => { setIsCategoryDropdownOpen(false); setIsManageCategoriesOpen(true); }}
                      className="px-4 py-3 cursor-pointer flex items-center gap-2 hover:bg-blue-50 text-[15px] text-[#3B5998] font-bold transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Category
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Source Stock & Cost + Pricing */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-4">
            <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Source Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative w-full" ref={sourceDropdownRef}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <label className="text-[14px] font-medium text-gray-400 uppercase tracking-wider">Select a Source</label>
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
                  <span className="text-[16px] text-gray-500">
                    {formData.sourceId
                      ? sources?.find((s: { id: string; source: string }) => s.id === formData.sourceId)?.source || 'Unknown'
                      : 'Select a Source'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isSourceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-150 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                    {sources?.map((source: { id: string; source: string }) => (
                      <div
                        key={source.id}
                        className={`px-4 py-3 text-[14px] cursor-pointer hover:bg-blue-50 flex items-center justify-between ${formData.sourceId === source.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700'}`}
                        onClick={() => toggleSource(source.id)}
                      >
                        <span>{source.source}</span>
                        {formData.sourceId === source.id && <Check className="h-4 w-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative w-full mt-[28px]">
                {formData.stock && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Stock</label>}
                <input type="number" placeholder="Stock" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="space-y-8 pt-2">
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
        </div>

        {/* Package Details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-[18px] font-bold text-[#1e2a4a]">Package Details</h3>
          <textarea
            placeholder="Package Include"
            rows={4}
            className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none resize-none"
            value={formData.packageInclude}
            onChange={(e) => setFormData({ ...formData, packageInclude: e.target.value })}
          />
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SPECIFICATION_FIELDS.map((field) => (
              <FloatingLabelField
                key={field.key}
                label={field.label}
                value={specifications[field.key] || ''}
                onChange={(e) => updateSpec(field.key, e.target.value)}
              />
            ))}
          </div>
        </div>

        {/* SEO & Scores */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="space-y-4">
            <label className="text-[16px] font-bold text-[#1e2a4a]">Keywords</label>
            <div className="border border-gray-200 rounded-xl p-3 min-h-[80px]">
              <div className="flex flex-wrap gap-2 mb-2">
                {keywordArray.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[14px] font-bold">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <textarea
                placeholder="Type keywords and press Enter or semi-colon (;)"
                className="w-full outline-none text-[16px] text-[#1e2a4a] resize-none"
                rows={2}
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
              />
            </div>
          </div>

          <div className="space-y-6">
            <FloatingLabelField
              label="SEO Title"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            />
            <FloatingLabelField
              label="Meta Description"
              value={formData.metaDescription}
              rows={2}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-[18px] font-bold text-[#1e2a4a]">Sky Score (0-10)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { key: 'materialHardnessScore', label: 'Material Hardness Score' },
                { key: 'threadPrecisionScore', label: 'Thread Precision Score' },
                { key: 'torqueRetentionScore', label: 'Torque Retention Score' },
                { key: 'feedbackScore', label: 'Feedback Score' },
              ].map((score) => (
                <FloatingLabelField
                  key={score.key}
                  label={score.label}
                  type="number"
                  min={0}
                  max={10}
                  value={formData[score.key as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [score.key]: e.target.value })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pb-8">
          <button
            type="button"
            disabled={draftLoading || publishLoading}
            onClick={(e) => handleSubmit(e, 'draft')}
            className="px-8 py-3 border-2 border-[#1e78ff] text-[#1e78ff] rounded-xl font-bold hover:bg-blue-50 transition-all disabled:opacity-50"
          >
            {draftLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save as Draft'}
          </button>
          <button
            type="submit"
            disabled={draftLoading || publishLoading}
            className="px-8 py-3 bg-[#1e78ff] text-white rounded-xl font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {publishLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {editAccessoryId ? 'Update Accessory' : 'Publish Accessory'}
          </button>
        </div>
      </form>

      {isManageSourcesOpen && (
        <ManageInventorySourcesModal onClose={() => setIsManageSourcesOpen(false)} />
      )}

      {isManageBrandsOpen && (
        <ManageBrandsModal
          category="accessory"
          onClose={() => setIsManageBrandsOpen(false)}
          onBrandsUpdated={fetchBrandsData}
        />
      )}

      <ManageAccessoryCategoriesModal
        open={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesUpdated={() => dispatch(fetchAccessoryCategories())}
        onCategoryCreated={(_id, categoryName) => {
          setFormData((prev) => ({ ...prev, category: categoryName }));
          handleCategorySelect(categoryName);
        }}
      />
    </div>
  );
}
