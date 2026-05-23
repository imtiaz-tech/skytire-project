'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createWireWheel, updateWireWheel } from '@/features/wire-wheels/slice';
import { fetchAllInventorySources } from '@/redux/slices/inventorySourcesSlice';
import { ArrowLeft, Loader2, UploadCloud, X, Plus, Trash2, Calculator, ChevronDown, Check } from 'lucide-react';
import { calculatePricing } from '@/utils/pricing';
import axios from 'axios';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

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

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: editWireWheelId ? '' : 'Enter wire wheel description...',
    showPlaceholder: !editWireWheelId,
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
  }), [editWireWheelId]);

  const { sources } = useAppSelector((state) => state.inventorySources);

  const [draftLoading, setDraftLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [brands, setBrands] = useState<{ id: string; brandName: string }[]>([]);

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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Keywords State
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

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
    name: '',
    description: '',
    size: '',
    finish: '',
    countryOfOrigin: '',
    brandId: '',
    sourceId: '',
    stock: '0',
    cost: '0',
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
    platingDepthScore: '0',
    sealingIntegrityScore: '0',
    spokeTensionScore: '0',
    feedbackScore: '0',
    isVisible: true,
    isActive: true,
    status: 'draft',
  });

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsRes = await axios.get('/api/admin/brands/dropdown?category=wheel');
        setBrands(brandsRes.data || []);
        dispatch(fetchAllInventorySources());
      } catch (error) {
        console.error('Error fetching brand/source data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

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
          name: wheel.name || '',
          description: wheel.description || '',
          size: wheel.size || '',
          finish: wheel.finish || '',
          countryOfOrigin: wheel.countryOfOrigin || '',
          brandId: wheel.brandId || '',
          sourceId: wheel.sourceId || '',
          stock: String(wheel.stock || 0),
          cost: wheel.cost != null ? Number(wheel.cost).toFixed(2) : '0.00',
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
          platingDepthScore: wheel.platingDepthScore != null ? String(wheel.platingDepthScore) : '0',
          sealingIntegrityScore: wheel.sealingIntegrityScore != null ? String(wheel.sealingIntegrityScore) : '0',
          spokeTensionScore: wheel.spokeTensionScore != null ? String(wheel.spokeTensionScore) : '0',
          feedbackScore: wheel.feedbackScore != null ? String(wheel.feedbackScore) : '0',
          isVisible: wheel.isVisible !== false,
          isActive: wheel.isActive !== false,
          status: wheel.status || 'draft',
        });

        if (wheel.keywords) {
          setKeywordArray(wheel.keywords.split(';').filter(Boolean));
        }

        if (wheel.images && Array.isArray(wheel.images)) {
          setExistingImages(wheel.images);
        }

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
    return calculatePricing(
      Number(formData.cost),
      Number(formData.shippingCost),
      Number(formData.salePrice),
      3.5
    );
  }, [formData.cost, formData.shippingCost, formData.salePrice]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (img: string) => {
    setExistingImages(prev => prev.filter(i => i !== img));
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  // Keyword tag helpers
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

      if (stockNum <= 0) return toast.error('Stock must be greater than 0');
      if (costNum <= 0) return toast.error('Cost Price is required');
      if (saleNum <= 0) return toast.error('Sale Price is required');
      if (regularNum <= 0) return toast.error('Regular Price is required');
      if (mapNum <= 0) return toast.error('MAP Price is required');

      if (saleNum < costNum) {
        return toast.error('Sale price must be greater than or equal to cost');
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

    if (finalStatus === 'draft') {
      setDraftLoading(true);
    } else {
      setPublishLoading(true);
    }

    try {
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

      submitData.set('status', finalStatus);

      // Main product images
      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      if (existingImages.length > 0) {
        submitData.append('existingImages', JSON.stringify(existingImages));
      }

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
          <div className="flex flex-wrap gap-4">
            {/* Add Images trigger */}
            <div className="w-[140px] h-[140px] border-2 border-dashed border-[#d1d5db] rounded-[24px] flex items-center justify-center bg-[#f8fafc] hover:bg-gray-100 transition-colors cursor-pointer relative shrink-0">
              <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} />
              <div className="flex items-center gap-1.5">
                <UploadCloud className="h-[22px] w-[22px] text-[#8c9bb1]" />
                <span className="text-[#8c9bb1] font-medium text-[15px]">Add Images</span>
              </div>
            </div>

            {/* Existing Images */}
            {existingImages.map((img, idx) => (
              <div key={`existing-${idx}`} className="w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border border-gray-100 group shrink-0 bg-white flex items-center justify-center">
                <img src={getImageUrl(img)} alt="Preview" className="w-full h-full object-contain" />
                <button type="button" onClick={() => removeExistingImage(img)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* New Images */}
            {imageFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="w-[140px] h-[140px] relative rounded-[24px] overflow-hidden border border-gray-100 group shrink-0 bg-white flex items-center justify-center">
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-contain" />
                <button type="button" onClick={() => removeNewImage(idx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
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
              <span className="text-[15px] font-medium text-[#1e2a4a]">Visible</span>
            </label>
          </div>

          <div className="relative w-full">
            {formData.name && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Product Name</label>}
            <input type="text" placeholder="Product Name" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
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
              <input type="text" placeholder="SKU" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] focus:ring-1 focus:ring-blue-500/50 outline-none font-semibold" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} required />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Brand</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={formData.brandId} onChange={(e) => setFormData({ ...formData, brandId: e.target.value })} required>
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.brandName}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Inventory Source</label>
              <select className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none appearance-none" value={formData.sourceId} onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })} required>
                <option value="">Select Inventory Source</option>
                {sources && sources.map(s => <option key={s.id} value={s.id}>{s.source}</option>)}
              </select>
            </div>
            <div className="relative w-full">
              {formData.countryOfOrigin && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Country of Origin</label>}
              <input type="text" placeholder="Country of Origin" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.countryOfOrigin} onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Pricing, Shipping and Stock details */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Logistics & Profit Margin Calculations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.stock && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Stock Level</label>}
              <input type="number" placeholder="Stock Level" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required />
            </div>
            <div className="relative w-full">
              {formData.cost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Unit Cost ($)</label>}
              <input type="number" step="0.01" placeholder="Unit Cost ($)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-blue-600 text-[16px] outline-none font-bold" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} required />
            </div>
            <div className="relative w-full">
              {formData.salePrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Sale Price ($)</label>}
              <input type="number" step="0.01" placeholder="Sale Price ($)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-green-600 text-[16px] outline-none font-bold" value={formData.salePrice} onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })} required />
              {pricing.recommendedSalePrice && Number(formData.salePrice) < parseFloat(pricing.recommendedSalePrice) && (
                <p className="mt-1 text-[13px] font-medium text-orange-500 italic">
                  Recommended sale price is: ${pricing.recommendedSalePrice} (23% markup)
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative w-full">
              {formData.regularPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Regular Price ($)</label>}
              <input type="number" step="0.01" placeholder="Regular Price ($)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.regularPrice} onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })} required />
            </div>
            <div className="relative w-full">
              {formData.mapPrice && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">MAP Price ($)</label>}
              <input type="number" step="0.01" placeholder="MAP Price ($)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.mapPrice} onChange={(e) => setFormData({ ...formData, mapPrice: e.target.value })} required />
            </div>
            <div className="relative w-full">
              {formData.shippingCost && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Cost ($)</label>}
              <input type="number" step="0.01" placeholder="Shipping Cost ($)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.shippingCost} onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.handlingFee && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Handling Fee ($)</label>}
              <input type="number" step="0.01" placeholder="Handling Fee ($)" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none" value={formData.handlingFee} onChange={(e) => setFormData({ ...formData, handlingFee: e.target.value })} />
            </div>
          </div>

          {/* Pricing calculations details card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <div>
              <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Calculator className="h-3 w-3 text-gray-400" /> Processing Amount (3.5%)
              </p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.processingAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1">Net Cost</p>
              <p className="text-[18px] font-bold text-[#1e2a4a]">${pricing.netCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-1">Markup %</p>
              <p className={`text-[18px] font-black ${pricing.marginPercentage && parseFloat(pricing.marginPercentage) < 0 ? 'text-red-500' : 'text-blue-600'}`}>
                {pricing.marginPercentage ? `${pricing.marginPercentage}%` : '0.00%'}
              </p>
            </div>
          </div>
        </div>


        {/* Technical Specs */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Technical Specifications</h3>
          
          {/* Wire Wheel Size & Finish Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Wire Wheel Size
              </label>
              <input
                type="text"
                placeholder="Size (e.g. 13x7, 20x8)"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Finish Description
              </label>
              <input
                type="text"
                placeholder="Finish (e.g. All Chrome, Gold Spoke)"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                value={formData.finish}
                onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Knock Off Options */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Knock Off Options
              </label>
              <input
                type="text"
                placeholder="Options"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                value={formData.knockOffOption}
                onChange={(e) => setFormData({ ...formData, knockOffOption: e.target.value })}
              />
            </div>

            {/* Options */}
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Options"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
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
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                value={formData.boltPattern}
                onChange={(e) => setFormData({ ...formData, boltPattern: e.target.value })}
              />
            </div>

            {/* Accessories */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Accessories
              </label>
              <input
                type="text"
                placeholder="Accessories"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                value={formData.accessories}
                onChange={(e) => setFormData({ ...formData, accessories: e.target.value })}
              />
            </div>
          </div>

          {/* Back Spacing */}
          <div className="relative w-full">
            <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
              Back Spacing
            </label>
            <input
              type="text"
              placeholder="Back Spacing"
              className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
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
                <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                  Spoke
                </label>
                <input
                  type="text"
                  placeholder="Spoke"
                  className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                  value={formData.spoke}
                  onChange={(e) => setFormData({ ...formData, spoke: e.target.value })}
                />
              </div>

              {/* Spoke Style */}
              <div className="relative w-full">
                <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                  Spoke Style
                </label>
                <input
                  type="text"
                  placeholder="Spoke Style"
                  className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                  value={formData.spokeStyle}
                  onChange={(e) => setFormData({ ...formData, spokeStyle: e.target.value })}
                />
              </div>
            </div>

            {/* Offset */}
            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Offset
              </label>
              <input
                type="text"
                placeholder="Offset"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
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
            <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
              Package Include
            </label>
            <textarea
              placeholder="Package Details"
              className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[120px] resize-y"
              value={formData.packageInclude}
              onChange={(e) => setFormData({ ...formData, packageInclude: e.target.value })}
            />
          </div>
        </div>

        {/* SEO Management */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">SEO & Search Optimization</h3>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <span className="text-[14px] font-bold text-gray-500">Keywords</span>
              <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-xl min-h-[100px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
                {keywordArray.map(kw => (
                  <span key={kw} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-blue-100 select-none">
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="text-blue-400 hover:text-blue-600 transition-colors font-bold text-xs"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={keywordArray.length === 0 ? "Type keywords and press Enter or semi-colon (;)" : "Add keyword..."}
                  className="flex-1 bg-transparent outline-none text-sm text-[#1e2a4a] min-w-[200px]"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                />
              </div>
            </div>

            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                SEO Title
              </label>
              <input
                type="text"
                placeholder="SEO Title"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                value={formData.seoTitle}
                onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              <label className="absolute -top-2 left-3 bg-white px-1.5 text-[11px] font-bold text-gray-400 transition-colors peer-focus:text-blue-500 z-10">
                Meta Description
              </label>
              <textarea
                placeholder="Meta Description"
                className="peer w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all min-h-[100px] resize-y"
                value={formData.metaDescription}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Scoring */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 space-y-8">
          <h3 className="text-[18px] font-bold text-[#1e2a4a] border-b border-gray-50 pb-4">Sky Wire Wheel Scores (0-10)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative w-full">
              {formData.platingDepthScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Plating Depth</label>}
              <input type="number" min="0" max="10" placeholder="Plating Depth" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.platingDepthScore} onChange={(e) => setFormData({ ...formData, platingDepthScore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.sealingIntegrityScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Sealing Integrity</label>}
              <input type="number" min="0" max="10" placeholder="Sealing Integrity" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.sealingIntegrityScore} onChange={(e) => setFormData({ ...formData, sealingIntegrityScore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.spokeTensionScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Spoke Tension</label>}
              <input type="number" min="0" max="10" placeholder="Spoke Tension" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.spokeTensionScore} onChange={(e) => setFormData({ ...formData, spokeTensionScore: e.target.value })} />
            </div>
            <div className="relative w-full">
              {formData.feedbackScore && <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">Customer Feedback</label>}
              <input type="number" min="0" max="10" placeholder="Feedback" className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50" value={formData.feedbackScore} onChange={(e) => setFormData({ ...formData, feedbackScore: e.target.value })} />
            </div>
          </div>
        </div>

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
    </div>
  );
}
