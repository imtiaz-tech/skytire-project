'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createWireWheel, updateWireWheel } from '@/features/wire-wheels/slice';
import { fetchAllInventorySources } from '@/redux/slices/inventorySourcesSlice';
import { ArrowLeft, Loader2, UploadCloud, X, Plus, Trash2, Calculator, ChevronDown, Check, Settings2, GripVertical } from 'lucide-react';
import { calculateTireNetCostPricing, calculateSaleMarkupPercentage, isSalePriceBelowRecommended } from '@/utils/pricing';
import axios from 'axios';
import toast from 'react-hot-toast';
import ManageInventorySourcesModal from './ManageInventorySourcesModal';
import StockCostDetailsTable from './StockCostDetailsTable';
import type { SourceInventoryRow } from '@/lib/sourceInventory';
import ManageBrandsModal from './ManageBrandsModal';
import { useShippingAutoFill } from '@/hooks/useShippingAutoFill';
import {
  isAllowedWireWheelVideoFile,
  isValidYouTubeUrl,
} from '@/lib/youtube';
import ProductCommonFields from './ProductCommonFields';

interface WireWheelFormProps {
  editWireWheelId?: string;
  duplicateId?: string;
}

interface ChipItem {
  id: string;
  name: string;
  image?: string | null;
  imageFile?: File | null;
}

type ProductImageItem =
  | { id: string; kind: 'existing'; path: string }
  | { id: string; kind: 'new'; file: File; previewUrl: string };

interface FloatingCapOption {
  id: string;
  name: string;
  price: string;
  image?: string | null;
  imageFile?: File | null;
}

interface KnockOffOption {
  id: string;
  name: string;
  price: string;
  image?: string | null;
  imageFile?: File | null;
  addChipOption: 'yes' | 'no';
  chips: ChipItem[];
}

export default function WireWheelForm({ editWireWheelId, duplicateId }: WireWheelFormProps) {
  const router = useRouter();

  const dispatch = useAppDispatch();


  const { sources } = useAppSelector((state) => state.inventorySources);

  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [brands, setBrands] = useState<{ id: string; brandName: string }[]>([]);

  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [sourceInventories, setSourceInventories] = useState<SourceInventoryRow[]>([]);

  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);

  const [activeDuplicateId, setActiveDuplicateId] = useState<string | null>(duplicateId || null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !duplicateId) {
      const id = sessionStorage.getItem('duplicateWireWheelId');
      if (id) {
        setActiveDuplicateId(id);
        sessionStorage.removeItem('duplicateWireWheelId');
      }
    }
  }, [duplicateId]);

  // Main Image States
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);
  const dragImageIndexRef = useRef<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);

  // Product video (max 1) + optional YouTube URL
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);
  const [youtubeUrlError, setYoutubeUrlError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Keywords / Tags / Also Found In / FAQs (UI handled by ProductCommonFields)
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [tagArray, setTagArray] = useState<string[]>([]);
  const [alsoFoundInArray, setAlsoFoundInArray] = useState<string[]>([]);
  const [faqs, setFaqs] = useState('');

  // Multi-option lists states
  const [floatingCapsList, setFloatingCapsList] = useState<FloatingCapOption[]>([]);
  const [knockOffsList, setKnockOffsList] = useState<KnockOffOption[]>([]);

  // Helpers to manage floating caps
  const addFloatingCap = () => {
    setFloatingCapsList(prev => [
      ...prev,
      {
        id: `cap_${Date.now()}_${Math.random()}`,
        name: '',
        price: '0',
        image: null,
        imageFile: null
      }
    ]);
  };

  const removeFloatingCap = (id: string) => {
    setFloatingCapsList(prev => prev.filter(item => item.id !== id));
  };

  const updateFloatingCapField = (id: string, field: keyof FloatingCapOption, value: any) => {
    setFloatingCapsList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Helpers to manage knockoffs
  const addKnockOff = () => {
    setKnockOffsList(prev => [
      ...prev,
      {
        id: `knock_${Date.now()}_${Math.random()}`,
        name: '',
        price: '0',
        image: null,
        imageFile: null,
        addChipOption: 'no',
        chips: []
      }
    ]);
  };

  const removeKnockOff = (id: string) => {
    setKnockOffsList(prev => prev.filter(item => item.id !== id));
  };

  const updateKnockOffField = (id: string, field: keyof KnockOffOption, value: any) => {
    setKnockOffsList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Helpers to manage chips nested inside a knockoff
  const addChipToKnockOff = (knockoffId: string) => {
    setKnockOffsList(prev => prev.map(item => {
      if (item.id === knockoffId) {
        return {
          ...item,
          chips: [
            ...(item.chips || []),
            {
              id: `chip_${Date.now()}_${Math.random()}`,
              name: '',
              image: null,
              imageFile: null
            }
          ]
        };
      }
      return item;
    }));
  };

  const removeChipFromKnockOff = (knockoffId: string, chipId: string) => {
    setKnockOffsList(prev => prev.map(item => {
      if (item.id === knockoffId) {
        return {
          ...item,
          chips: item.chips.filter(chip => chip.id !== chipId)
        };
      }
      return item;
    }));
  };

  const updateChipField = (knockoffId: string, chipId: string, field: keyof ChipItem, value: any) => {
    setKnockOffsList(prev => prev.map(item => {
      if (item.id === knockoffId) {
        return {
          ...item,
          chips: item.chips.map(chip => {
            if (chip.id === chipId) {
              return { ...chip, [field]: value };
            }
            return chip;
          })
        };
      }
      return item;
    }));
  };

  const [formData, setFormData] = useState({
    sku: '',
    alternatePartNumber: '',
    upcNo: '',
    name: '',
    description: '',
    size: '',
    finish: '',
    countryOfOrigin: '',
    brandId: '',
    sourceId: '',
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
    packageInclude: '',
    knockOffOption: '',
    options: '',
    boltPattern: '',
    accessories: '',
    backSpacing: '',
    spoke: '',
    spokeStyle: '',
    offset: '',
    keywords: '',
    seoTitle: '',
    metaDescription: '',
    platingDepthScore: '',
    sealingIntegrityScore: '',
    spokeTensionScore: '',
    feedbackScore: '',
    isVisible: true,
    isActive: true,
    status: 'draft',
    staggeredFitment: false,
    wireWheelWeight: '',
    shippingDimensions: '',
    youtubeUrl: '',
  });

  const { handleSizeBlur, handleSizeChange } = useShippingAutoFill({
    category: 'WIRE_WHEEL',
    weightField: 'wireWheelWeight',
    onApply: useCallback((fields) => {
      setFormData((prev) => ({ ...prev, ...fields }));
    }, []),
  });

  // Fetch brands data
  const fetchBrandsData = async () => {
    try {
      const brandsRes = await axios.get('/api/admin/brands/dropdown?category=wire_wheel');
      setBrands(brandsRes.data || []);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  // Fetch dropdown data
  useEffect(() => {
    fetchBrandsData();
    dispatch(fetchAllInventorySources());
  }, [dispatch]);

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

  const toggleSource = (sourceId: string) => {
    setFormData(prev => {
      const isSelected = prev.sourceId === sourceId;
      if (isSelected) {
        return { ...prev, sourceId: '' };
      } else {
        return { ...prev, sourceId };
      }
    });
    setIsSourceDropdownOpen(false);
  };

  // Load edit/duplicate data
  useEffect(() => {
    const loadInitialData = async () => {
      const targetId = editWireWheelId || activeDuplicateId;
      if (!targetId) return;

      setFetching(true);
      try {
        const res = await axios.get(`/api/admin/wire-wheels/${targetId}`);
        const wheel = res.data;

        setFormData({
          sku: activeDuplicateId ? '' : (wheel.sku || ''),
          alternatePartNumber: wheel.alternatePartNumber || '',
          upcNo: wheel.upcNo || '',
          name: wheel.name || '',
          description: wheel.description || '',
          size: wheel.size || '',
          finish: wheel.finish || '',
          countryOfOrigin: wheel.countryOfOrigin || '',
          brandId: wheel.brandId || '',
          sourceId: wheel.sourceId || '',
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
          packageInclude: wheel.packageInclude || '',
          knockOffOption: wheel.knockOffOption || '',
          options: wheel.options || '',
          boltPattern: wheel.boltPattern || '',
          accessories: wheel.accessories || '',
          backSpacing: wheel.backSpacing != null ? String(wheel.backSpacing) : '',
          spoke: wheel.spoke != null ? String(wheel.spoke) : '',
          spokeStyle: wheel.spokeStyle || '',
          offset: wheel.offset || '',
          keywords: wheel.keywords || '',
          seoTitle: wheel.seoTitle || '',
          metaDescription: wheel.metaDescription || '',
          platingDepthScore: wheel.platingDepthScore != null ? String(wheel.platingDepthScore) : '',
          sealingIntegrityScore: wheel.sealingIntegrityScore != null ? String(wheel.sealingIntegrityScore) : '',
          spokeTensionScore: wheel.spokeTensionScore != null ? String(wheel.spokeTensionScore) : '',
          feedbackScore: wheel.feedbackScore != null ? String(wheel.feedbackScore) : '',
          isVisible: wheel.isVisible !== false,
          isActive: wheel.isActive !== false,
          status: wheel.status || 'draft',
          staggeredFitment: wheel.staggeredFitment || false,
          wireWheelWeight: wheel.wireWheelWeight || '',
          shippingDimensions: wheel.shippingDimensions || '',
          youtubeUrl: wheel.youtubeUrl || '',
        });

        if (wheel.keywords) {
          setKeywordArray(wheel.keywords.split(';').filter(Boolean));
        }
        setFaqs(wheel.faqs || '');
        setTagArray(Array.isArray(wheel.tags) ? wheel.tags : []);
        setAlsoFoundInArray(Array.isArray(wheel.alsoFoundIn) ? wheel.alsoFoundIn : []);

        if (wheel.images && Array.isArray(wheel.images)) {
          setProductImages(
            wheel.images.map((path: string, index: number) => ({
              id: `existing-${index}-${path}`,
              kind: 'existing' as const,
              path,
            }))
          );
        } else {
          setProductImages([]);
        }

        setExistingVideo(wheel.video || null);
        setVideoFile(null);
        setSourceInventories(wheel.sourceInventories || []);

        // Setup Floating Caps JSON (now array)
        if (wheel.floatingCaps) {
          if (Array.isArray(wheel.floatingCaps)) {
            setFloatingCapsList(wheel.floatingCaps.map((c: any, index: number) => ({
              id: c.id || `cap_${Date.now()}_${index}_${Math.random()}`,
              name: c.name || '',
              price: c.price != null ? String(c.price) : '0',
              image: c.image || null,
              imageFile: null
            })));
          } else if (Object.keys(wheel.floatingCaps).length > 0) {
            // legacy fallback
            setFloatingCapsList([{
              id: `cap_${Date.now()}_0`,
              name: wheel.floatingCaps.name || '',
              price: wheel.floatingCaps.price != null ? String(wheel.floatingCaps.price) : '0',
              image: wheel.floatingCaps.image || null,
              imageFile: null
            }]);
          } else {
            setFloatingCapsList([]);
          }
        } else {
          setFloatingCapsList([]);
        }

        // Setup Knockoffs JSON (now array)
        if (wheel.knockOffs) {
          if (Array.isArray(wheel.knockOffs)) {
            setKnockOffsList(wheel.knockOffs.map((k: any, index: number) => ({
              id: k.id || `knock_${Date.now()}_${index}_${Math.random()}`,
              name: k.name || '',
              price: k.price != null ? String(k.price) : '0',
              image: k.image || null,
              imageFile: null,
              addChipOption: k.addChipOption || (k.chips && k.chips.length > 0 ? 'yes' : 'no'),
              chips: Array.isArray(k.chips) ? k.chips.map((c: any, cIdx: number) => ({
                id: c.id || `chip_${Date.now()}_${index}_${cIdx}_${Math.random()}`,
                name: c.name || '',
                image: c.image || null,
                imageFile: null
              })) : []
            })));
          } else if (Object.keys(wheel.knockOffs).length > 0) {
            // legacy fallback
            setKnockOffsList([{
              id: `knock_${Date.now()}_0`,
              name: wheel.knockOffs.name || '',
              price: wheel.knockOffs.price != null ? String(wheel.knockOffs.price) : '0',
              image: wheel.knockOffs.image || null,
              imageFile: null,
              addChipOption: wheel.knockOffs.chipOption === 'yes' ? 'yes' : 'no',
              chips: Array.isArray(wheel.knockOffs.chips) ? wheel.knockOffs.chips.map((c: any, cIdx: number) => ({
                id: c.id || `chip_${Date.now()}_0_${cIdx}`,
                name: c.name || '',
                image: c.image || null,
                imageFile: null
              })) : []
            }]);
          } else {
            setKnockOffsList([]);
          }
        } else {
          setKnockOffsList([]);
        }

      } catch (error) {
        console.error('Error loading wire wheel data:', error);
        toast.error('Failed to load wire wheel data');
      } finally {
        setFetching(false);
      }
    };
    loadInitialData();
  }, [editWireWheelId, activeDuplicateId]);

  // Pricing calculations
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const items: ProductImageItem[] = newFiles.map((file, index) => ({
        id: `new-${Date.now()}-${index}-${file.name}`,
        kind: 'new',
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      setProductImages((prev) => [...prev, ...items]);
    }
    e.target.value = '';
  };

  const removeProductImage = (id: string) => {
    setProductImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.kind === 'new') {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const reorderProductImages = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setProductImages((prev) => {
      if (fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const handleImageDragStart = (index: number) => (e: React.DragEvent) => {
    dragImageIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleImageDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverImageIndex !== index) {
      setDragOverImageIndex(index);
    }
  };

  const handleImageDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIndex = dragImageIndexRef.current;
    dragImageIndexRef.current = null;
    setDragOverImageIndex(null);
    if (fromIndex == null) return;
    reorderProductImages(fromIndex, index);
  };

  const handleImageDragEnd = () => {
    dragImageIndexRef.current = null;
    setDragOverImageIndex(null);
  };

  const productImagesRef = useRef(productImages);
  productImagesRef.current = productImages;

  useEffect(() => {
    return () => {
      productImagesRef.current.forEach((item) => {
        if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isAllowedWireWheelVideoFile(file)) {
      toast.error('Video must be an mp4, mov, or webm file');
      e.target.value = '';
      return;
    }
    setVideoFile(file);
    // Selecting a new file replaces the previous upload on save
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

  // Keyword tag helpers

  const handleSubmit = async (e: React.FormEvent, statusOverride?: 'published' | 'draft') => {
    e.preventDefault();
    const finalStatus = statusOverride || formData.status || 'published';

    if (finalStatus === 'published') {
      if (!formData.name) return toast.error('Product Name is required');
      if (!formData.sku) return toast.error('SKU is required');
      if (!formData.size) return toast.error('Size is required');
      if (!formData.brandId) return toast.error('Brand is required');
      if (!formData.sourceId) return toast.error('Inventory Source is required');

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
      if (saleNum <= 0) return toast.error('Sale Price is required');
      if (regularNum <= 0) return toast.error('Regular Price is required');
      if (mapNum <= 0) return toast.error('MAP Price is required');

      if (isSalePriceBelowRecommended(saleNum, tirePricing.minimumSalePrice)) {
        return toast.error('Sale Price cannot be lower than the Recommended Sale Price.');
      }
      if (regularNum <= saleNum) {
        return toast.error('Regular price must be greater than sale price');
      }
      if (saleNum < mapNum) {
        return toast.error('Sale price must be greater than or equal to MAP price');
      }

      // Score ranges
      const plating = parseInt(formData.platingDepthScore) || 0;
      const sealing = parseInt(formData.sealingIntegrityScore) || 0;
      const tension = parseInt(formData.spokeTensionScore) || 0;
      const feedback = parseInt(formData.feedbackScore) || 0;
      if (plating < 0 || plating > 10) return toast.error('Plating Depth Score must be 0-10');
      if (sealing < 0 || sealing > 10) return toast.error('Sealing Integrity Score must be 0-10');
      if (tension < 0 || tension > 10) return toast.error('Spoke Tension Score must be 0-10');
      if (feedback < 0 || feedback > 10) return toast.error('Feedback Score must be 0-10');
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
        if (key === 'keywords') {
          submitData.append(key, keywordArray.join(';'));
        } else if (typeof value === 'boolean') {
          submitData.append(key, value.toString());
        } else {
          submitData.append(key, String(value || ''));
        }
      });

      submitData.set('faqs', faqs || '');
      submitData.set('tags', JSON.stringify(tagArray));
      submitData.set('alsoFoundIn', JSON.stringify(alsoFoundInArray));

      submitData.set('processingAmount', String(tirePricing.processingAmount));
      submitData.set('marginAmount', String(tirePricing.marginAmount));
      submitData.set('netCost', String(tirePricing.netCost));
      submitData.set('minimumSalePrice', String(tirePricing.minimumSalePrice));
      submitData.set('status', finalStatus);

      // Main product images (order preserved via imageOrder)
      const existingPaths: string[] = [];
      const imageOrder: string[] = [];
      let newImageIndex = 0;
      productImages.forEach((item) => {
        if (item.kind === 'existing') {
          existingPaths.push(item.path);
          imageOrder.push(item.path);
        } else {
          submitData.append('images', item.file);
          imageOrder.push(`__new__:${newImageIndex}`);
          newImageIndex += 1;
        }
      });
      if (existingPaths.length > 0) {
        submitData.append('existingImages', JSON.stringify(existingPaths));
      }
      submitData.append('imageOrder', JSON.stringify(imageOrder));

      // Product video (optional, max 1) — always send existingVideo so removals clear the DB field
      if (videoFile) {
        submitData.append('video', videoFile);
      }
      submitData.append('existingVideo', existingVideo || '');
      submitData.set('youtubeUrl', trimmedYoutube);

      // Add Floating Cap JSON & Sub-images
      const finalCapsJson = floatingCapsList.map((cap, index) => {
        const tempKey = cap.imageFile ? `cap_image_${index}` : undefined;
        if (cap.imageFile && tempKey) {
          submitData.append(tempKey, cap.imageFile);
        }
        return {
          name: cap.name,
          price: parseFloat(cap.price) || 0,
          image: cap.image || undefined,
          tempImageKey: tempKey
        };
      });
      submitData.append('floatingCaps', JSON.stringify(finalCapsJson));

      // Add Knockoffs JSON & Sub-images
      const finalKnockoffsJson = knockOffsList.map((knockoff, kIndex) => {
        const tempKey = knockoff.imageFile ? `knockoff_image_${kIndex}` : undefined;
        if (knockoff.imageFile && tempKey) {
          submitData.append(tempKey, knockoff.imageFile);
        }

        const chipsJson = (knockoff.chips || []).map((chip, cIndex) => {
          const chipTempKey = chip.imageFile ? `chip_image_${kIndex}_${cIndex}` : undefined;
          if (chip.imageFile && chipTempKey) {
            submitData.append(chipTempKey, chip.imageFile);
          }
          return {
            name: chip.name,
            image: chip.image || undefined,
            tempImageKey: chipTempKey
          };
        });

        return {
          name: knockoff.name,
          price: parseFloat(knockoff.price) || 0,
          image: knockoff.image || undefined,
          tempImageKey: tempKey,
          addChipOption: knockoff.addChipOption,
          chips: chipsJson
        };
      });
      submitData.append('knockOffs', JSON.stringify(finalKnockoffsJson));

      if (editWireWheelId) {
        await dispatch(updateWireWheel({ id: editWireWheelId, data: submitData })).unwrap();
        toast.success('Wire Wheel updated successfully');
      } else {
        await dispatch(createWireWheel(submitData)).unwrap();
        toast.success('Wire Wheel created successfully');
      }

      router.push('/admin/wire-wheels');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save wire wheel data');
    } finally {
      setDraftLoading(false);
      setPublishLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#1e2a4a] animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Loading wire wheel data...</p>
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
          {editWireWheelId ? 'Edit Wire Wheel' : 'Add New Wire Wheel'}
        </h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'published')} className="space-y-12">
        
        {/* Images section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Product Images</h3>
          <p className="text-sm text-gray-500 -mt-2">Drag images to reorder. The first image is used as the primary photo.</p>
          <div className="flex flex-wrap gap-4">
            {/* Add Images trigger */}
            <div className="w-[140px] h-[140px] border-2 border-dashed border-[#d1d5db] rounded-[24px] flex items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative shrink-0">
              <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} />
              <div className="flex items-center gap-1.5">
                <UploadCloud className="h-[22px] w-[22px] text-[#8c9bb1]" />
                <span className="text-[#8c9bb1] font-medium text-[15px]">Add Images</span>
              </div>
            </div>

            {productImages.map((item, idx) => {
              const src = item.kind === 'existing' ? getImageUrl(item.path) : item.previewUrl;
              const isDragOver = dragOverImageIndex === idx;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={handleImageDragStart(idx)}
                  onDragOver={handleImageDragOver(idx)}
                  onDrop={handleImageDrop(idx)}
                  onDragEnd={handleImageDragEnd}
                  className={`w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border group shrink-0 bg-white flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ${
                    isDragOver ? 'border-blue-500 ring-2 ring-blue-200 scale-[1.02]' : 'border-gray-100'
                  }`}
                  title="Drag to reorder"
                >
                  <img src={src} alt={`Product ${idx + 1}`} className="w-full h-full object-contain pointer-events-none" />
                  <div className="absolute top-2 left-2 p-1 bg-black/45 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[11px] font-semibold">
                    {idx + 1}
                  </span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => removeProductImage(item.id)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
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

        {/* Knock-Off Options Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[20px] font-bold text-blue-600">Knock-Off Options</h3>
          
          {knockOffsList.map((knockoff, index) => (
            <div key={knockoff.id} className="bg-white rounded-[24px] p-6 border border-gray-200/80 shadow-sm space-y-6 relative">
              <div className="flex items-center justify-between border-b border-gray-150 pb-4">
                <h4 className="text-[16px] font-bold text-gray-500">Knock-Off Option {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeKnockOff(knockoff.id)}
                  className="text-red-500 hover:text-red-600 font-bold text-sm flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete Knock-Off
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Image Uploader */}
                <div className="w-[140px] h-[140px] border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative shrink-0">
                  {knockoff.imageFile ? (
                    <img src={URL.createObjectURL(knockoff.imageFile)} alt="Preview" className="w-full h-full object-contain rounded-[24px]" />
                  ) : knockoff.image ? (
                    <img src={getImageUrl(knockoff.image)} alt="Existing" className="w-full h-full object-contain rounded-[24px]" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400">
                      <UploadCloud className="h-[24px] w-[24px]" />
                      <span className="text-xs font-semibold">Add Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        updateKnockOffField(knockoff.id, 'imageFile', e.target.files[0]);
                        updateKnockOffField(knockoff.id, 'image', null);
                      }
                    }}
                  />
                </div>

                {/* Form Fields */}
                <div className="flex-1 w-full space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative md:col-span-3">
                      <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-bold text-blue-500 z-10">Knock-Off Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Gold Cross Knock Off"
                        className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-xl text-[#1e2a4a] text-sm focus:outline-none font-semibold"
                        value={knockoff.name}
                        onChange={(e) => updateKnockOffField(knockoff.id, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-medium text-gray-400 z-10">Price ($)</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        value={knockoff.price}
                        onChange={(e) => updateKnockOffField(knockoff.id, 'price', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Radio options */}
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-gray-700">Add Chip Option?</p>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-gray-600">
                        <input
                          type="radio"
                          name={`addChipOption-${knockoff.id}`}
                          checked={knockoff.addChipOption === 'yes'}
                          onChange={() => updateKnockOffField(knockoff.id, 'addChipOption', 'yes')}
                          className="w-4 h-4 cursor-pointer text-blue-600"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-gray-600">
                        <input
                          type="radio"
                          name={`addChipOption-${knockoff.id}`}
                          checked={knockoff.addChipOption === 'no'}
                          onChange={() => updateKnockOffField(knockoff.id, 'addChipOption', 'no')}
                          className="w-4 h-4 cursor-pointer text-blue-600"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  {/* Sub-chips builder */}
                  {knockoff.addChipOption === 'yes' && (
                    <div className="space-y-4 pt-4 border-t border-dashed border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dynamic Chips</span>
                        <button
                          type="button"
                          onClick={() => addChipToKnockOff(knockoff.id)}
                          className="bg-[#1e2a4a] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-opacity-90 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Chip
                        </button>
                      </div>

                      {knockoff.chips.length === 0 ? (
                        <p className="text-xs italic text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed">
                          Click Add Chip to add sub-options for this knockoff
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {knockoff.chips.map((chip) => (
                            <div key={chip.id} className="flex items-center gap-3 bg-[#f8fafc] p-3 rounded-xl border border-gray-100 shadow-sm relative">
                              {/* Chip Image */}
                              <div className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center bg-white relative cursor-pointer shrink-0">
                                {chip.imageFile ? (
                                  <img src={URL.createObjectURL(chip.imageFile)} alt="Chip" className="w-full h-full object-contain rounded-lg" />
                                ) : chip.image ? (
                                  <img src={getImageUrl(chip.image)} alt="Chip" className="w-full h-full object-contain rounded-lg" />
                                ) : (
                                  <UploadCloud className="h-4 w-4 text-gray-400" />
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      updateChipField(knockoff.id, chip.id, 'imageFile', e.target.files[0]);
                                      updateChipField(knockoff.id, chip.id, 'image', null);
                                    }
                                  }}
                                />
                              </div>

                              <div className="relative flex-1">
                                <label className="absolute -top-2 left-2 bg-[#f8fafc] px-1 text-[9px] font-bold text-gray-400">Chip Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Chrome Crest"
                                  className="w-full px-2.5 py-1.5 bg-transparent border border-gray-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-500"
                                  value={chip.name}
                                  onChange={(e) => updateChipField(knockoff.id, chip.id, 'name', e.target.value)}
                                  required
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeChipFromKnockOff(knockoff.id, chip.id)}
                                className="p-1 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors border-none cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addKnockOff}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-xl text-sm font-bold bg-transparent hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Knock-Off
          </button>
        </div>

        {/* Floating Caps Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[20px] font-bold text-blue-600">Floating Caps</h3>

          {floatingCapsList.map((cap, index) => (
            <div key={cap.id} className="bg-white rounded-[24px] p-6 border border-gray-200/80 shadow-sm space-y-6 relative">
              <div className="flex items-center justify-between border-b border-gray-150 pb-4">
                <h4 className="text-[16px] font-bold text-gray-500">Floating Cap Option {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeFloatingCap(cap.id)}
                  className="text-red-500 hover:text-red-600 font-bold text-sm flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete Floating Cap
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Image Uploader */}
                <div className="w-[140px] h-[140px] border-2 border-dashed border-gray-200 rounded-[24px] flex flex-col items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative shrink-0">
                  {cap.imageFile ? (
                    <img src={URL.createObjectURL(cap.imageFile)} alt="Preview" className="w-full h-full object-contain rounded-[24px]" />
                  ) : cap.image ? (
                    <img src={getImageUrl(cap.image)} alt="Existing" className="w-full h-full object-contain rounded-[24px]" />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-gray-400">
                      <UploadCloud className="h-[24px] w-[24px]" />
                      <span className="text-xs font-semibold">Add Image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        updateFloatingCapField(cap.id, 'imageFile', e.target.files[0]);
                        updateFloatingCapField(cap.id, 'image', null);
                      }
                    }}
                  />
                </div>

                {/* Form Fields */}
                <div className="flex-grow w-full">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative md:col-span-3">
                      <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-bold text-blue-500 z-10">Cap Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Chrome Floating Cap"
                        className="w-full px-4 py-3 bg-transparent border-2 border-blue-500 rounded-xl text-[#1e2a4a] text-sm focus:outline-none font-semibold"
                        value={cap.name}
                        onChange={(e) => updateFloatingCapField(cap.id, 'name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-medium text-gray-400 z-10">Price ($)</label>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full px-4 py-3 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        value={cap.price}
                        onChange={(e) => updateFloatingCapField(cap.id, 'price', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addFloatingCap}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-xl text-sm font-bold bg-transparent hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Add Floating Cap
          </button>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
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
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-[18px] h-[18px] rounded-[4px] border border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer outline-none"
              />
              <span className="text-[15px] font-medium text-[#1e2a4a]">Featured</span>
            </label>
          </div>

          <div className="relative w-full">
            {formData.name && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[14px] font-medium text-gray-400 z-10">Product Name</label>}
            <input type="text" placeholder="Product Name" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>

          <ProductCommonFields
            sections={['description']}
            description={formData.description}
            onDescriptionChange={(html) => setFormData({ ...formData, description: html })}
            descriptionPlaceholder={editWireWheelId ? '' : 'Enter wire wheel description...'}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
            <div className="relative w-full">
              {formData.sku && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">SKU</label>}
              <input type="text" placeholder="SKU" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
            </div>
            <div className="relative w-full">
              {formData.alternatePartNumber && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Alternate Part Number</label>}
              <input type="text" placeholder="Alternate Part Number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.alternatePartNumber} onChange={(e) => setFormData({ ...formData, alternatePartNumber: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.upcNo && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">UPC Number</label>}
              <input type="text" placeholder="UPC Number" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none" value={formData.upcNo} onChange={(e) => setFormData({ ...formData, upcNo: e.target.value })} />
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
              {formData.countryOfOrigin && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Country of Origin</label>}
              <input type="text" placeholder="Country of Origin" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.countryOfOrigin} onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-medium text-gray-400 z-10">Size</label>
              <input type="text" placeholder="Size (e.g. 13x7, 20x8)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all outline-none" value={formData.size} onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, size: value });
                handleSizeChange(value);
              }} onBlur={(e) => handleSizeBlur(e.target.value)} required />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-medium text-gray-400 z-10">Finish</label>
              <input type="text" placeholder="Finish (e.g. All Chrome, Gold Spoke)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all outline-none" value={formData.finish} onChange={(e) => setFormData({ ...formData, finish: e.target.value })} />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[12px] font-medium text-gray-400 z-10">Staggered Fitment</label>
              <select
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all outline-none appearance-none cursor-pointer"
                value={formData.staggeredFitment ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, staggeredFitment: e.target.value === 'true' })}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="relative w-full">
              {formData.wireWheelWeight && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Wire Wheel Weight</label>}
              <input type="text" placeholder="Wire Wheel Weight" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.wireWheelWeight} onChange={(e) => setFormData({ ...formData, wireWheelWeight: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.shippingDimensions && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Dimensions</label>}
              <input type="text" placeholder="Shipping Dimensions" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.shippingDimensions} onChange={(e) => setFormData({ ...formData, shippingDimensions: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Pricing, Shipping and Stock details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          
          <div className="space-y-4">
            <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Source Stock</h3>
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
                    {formData.sourceId ? (() => {
                      const source = sources?.find((s: { id: string; source: string }) => s.id === formData.sourceId);
                      return (
                        <span key={formData.sourceId} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[13px] font-bold flex items-center gap-1">
                          {source?.source || 'Unknown'}
                          <X className="h-3 w-3 hover:text-blue-800" onClick={(e) => { e.stopPropagation(); toggleSource(formData.sourceId); }} />
                        </span>
                      );
                    })() : (
                      <span className="text-gray-500">Select a Source</span>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isSourceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-150 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {sources && sources.length > 0 ? (
                      sources.map((source: { id: string; source: string }) => (
                        <div key={source.id} className={`px-4 py-3 text-[14px] cursor-pointer hover:bg-blue-50 flex items-center justify-between transition-colors ${formData.sourceId === source.id ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 font-medium'}`} onClick={() => toggleSource(source.id)}>
                          <span>{source.source}</span>
                          {formData.sourceId === source.id && <Check className="h-4 w-4" />}
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
                <input type="number" placeholder="Stock" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
              </div>
            </div>

          </div>

          <div className="space-y-8 pt-2">
            <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Pricing Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative w-full">
                {formData.cost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Cost ($)</label>}
                <input type="number" placeholder="Cost ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold text-blue-600" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} onWheel={(e) => e.currentTarget.blur()} required />
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
                <input type="number" placeholder="Sale Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none font-bold text-green-600" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} onWheel={(e) => e.currentTarget.blur()} required />
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
                <input type="number" placeholder="MAP Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.mapPrice} onChange={(e) => setFormData({ ...formData, mapPrice: e.target.value })} onWheel={(e) => e.currentTarget.blur()} required />
              </div>
              <div className="relative w-full">
                {formData.regularPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Regular Price ($)</label>}
                <input type="number" placeholder="Regular Price ($)" step="0.01" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.regularPrice} onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })} onWheel={(e) => e.currentTarget.blur()} required />
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

            {editWireWheelId && sourceInventories.length > 0 && (
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
        </div>


        {/* Technical Specs */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Technical Specifications</h3>
          
          {/* Knock Off & Additional Options */}          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Knock Off Options */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Knock Off Options
              </label>
              <input
                type="text"
                placeholder="Options"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={formData.knockOffOption}
                onChange={(e) => setFormData({ ...formData, knockOffOption: e.target.value })}
              />
            </div>

            {/* Options */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Options"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={formData.options}
                onChange={(e) => setFormData({ ...formData, options: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bolt Pattern */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Bolt Pattern
              </label>
              <input
                type="text"
                placeholder="Bolt Pattern"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={formData.boltPattern}
                onChange={(e) => setFormData({ ...formData, boltPattern: e.target.value })}
              />
            </div>

            {/* Accessories */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[12px]  text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Accessories
              </label>
              <input
                type="text"
                placeholder="Accessories"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={formData.accessories}
                onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
              />
            </div>
          </div>

          {/* Back Spacing */}
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 bg-white px-1.5 text-[12px]  text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
              Back Spacing
            </label>
            <input
              type="text"
              placeholder="Back Spacing"
              className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
              value={formData.backSpacing}
              onChange={(e) => setFormData({ ...formData, backSpacing: e.target.value })}
            />
          </div>

          {/* Features Section */}
          <div className="space-y-6 pt-4 border-t border-dashed border-gray-100">
            <h4 className="text-[16px] font-bold text-[#1e2a4a]">Features</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spoke */}
              <div className="relative w-full">
                <label className="absolute -top-2 left-3 bg-white px-1.5 text-[12px]  text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                  Spoke
                </label>
                <input
                  type="text"
                  placeholder="Spoke"
                  className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  value={formData.spoke}
                  onChange={(e) => setFormData({ ...formData, spoke: e.target.value })}
                />
              </div>

              {/* Spoke Style */}
              <div className="relative w-full">
                <label className="absolute -top-2 left-3 bg-white px-1.5 text-[12px]  text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                  Spoke Style
                </label>
                <input
                  type="text"
                  placeholder="Spoke Style"
                  className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  value={formData.spokeStyle}
                  onChange={(e) => setFormData({ ...formData, spokeStyle: e.target.value })}
                />
              </div>
            </div>

            {/* Offset */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[12px] text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Offset
              </label>
              <input
                type="text"
                placeholder="Offset"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={formData.offset}
                onChange={(e) => setFormData({ ...formData, offset: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Package Details Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Package Details</h3>
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 bg-white px-1.5 text-[12px] text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
              Package Include
            </label>
            <textarea
              placeholder="Package Details"
              className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[120px] resize-y"
              value={formData.packageInclude}
              onChange={(e) => setFormData({ ...formData, packageInclude: e.target.value })}
            />
          </div>
        </div>

        {/* SEO / FAQs / Tags / Also Found In / Sky Score */}
        <ProductCommonFields
          sections={['seo', 'faqs', 'scores']}
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
          scoreFields={[
            { key: 'platingDepthScore', label: 'Plating Depth Score' },
            { key: 'sealingIntegrityScore', label: 'Sealing Integrity Score' },
            { key: 'spokeTensionScore', label: 'Spoke Tension Score' },
            { key: 'feedbackScore', label: 'Feedback Score' }
          ]}
          scores={{
            platingDepthScore: formData.platingDepthScore,
            sealingIntegrityScore: formData.sealingIntegrityScore,
            spokeTensionScore: formData.spokeTensionScore,
            feedbackScore: formData.feedbackScore
          }}
          onScoreChange={(key, value) => setFormData({ ...formData, [key]: value })}
        />

        {/* Submit Actions */}
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
            {publishLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (editWireWheelId ? 'Update Wire Wheel' : 'Save Wire Wheel')}
          </button>
        </div>

      </form>

      {isManageSourcesOpen && (
        <ManageInventorySourcesModal onClose={() => setIsManageSourcesOpen(false)} />
      )}

      {isManageBrandsOpen && (
        <ManageBrandsModal
          category="wire_wheel"
          onClose={() => setIsManageBrandsOpen(false)}
          onBrandsUpdated={fetchBrandsData}
        />
      )}
    </div>
  );
}
