'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createTireModel, updateTireModel } from '@/redux/slices/tireModelsSlice';
import { TireModel } from '@/redux/types/tireModelTypes';
import { ArrowLeft, Upload, X, Loader2, Plus, Image as ImageIcon, ChevronDown, Check, GripVertical } from 'lucide-react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import ManageBrandsModal from './ManageBrandsModal';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface TireModelFormProps {
  editModel?: TireModel;
}

type ProductImageItem =
  | { id: string; kind: 'existing'; path: string }
  | { id: string; kind: 'new'; file: File; previewUrl: string };

const seasons = ['Summer', 'Winter', 'All Season', 'All Weather'];
const performances = [
  'All Terrain',
  'Extreme Terrain',
  'High Performance',
  'Highway',
  'Mud Terrain',
  'Passenger',
  'Performance',
  'Rugged Terrain',
  'Touring',
  'Ultra High Performance'
];

export default function TireModelForm({ editModel }: TireModelFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<{ id: string; brandName: string }[]>([]);
  
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);

  // Images State
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);
  const dragImageIndexRef = useRef<number | null>(null);
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null);


  const [formData, setFormData] = useState({
    modelName: '',
    brandId: '',
    description: '',
    season: 'All Season',
    performance: 'Touring',
    treadDesign: '',
    runFlat: false,
    threePMS: false,
    warranty: '',
    treadLife: '',
  });

  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: editModel ? '' : 'Enter model description...',
    showPlaceholder: !editModel,
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
  }), [editModel]);

  const fetchBrandsData = async () => {
    try {
      const response = await axios.get('/api/admin/brands/dropdown?category=tire');
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  useEffect(() => {
    fetchBrandsData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editModel) {
      setFormData({
        modelName: editModel.modelName,
        brandId: editModel.brandId,
        description: editModel.description || '',
        season: editModel.season || 'All Season',
        performance: editModel.performance || 'Touring',
        treadDesign: editModel.treadDesign || '',
        runFlat: editModel.runFlat || false,
        threePMS: editModel.threePMS || false,
        warranty: editModel.warranty || '',
        treadLife: editModel.treadLife || '',
      });
      setProductImages(
        (editModel.images || []).map((path: string, index: number) => ({
          id: `existing-${index}-${path}`,
          kind: 'existing' as const,
          path,
        }))
      );
    }
  }, [editModel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const items: ProductImageItem[] = files.map((file, index) => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('modelName', formData.modelName);
    data.append('brandId', formData.brandId);
    data.append('description', formData.description);
    data.append('season', formData.season);
    data.append('performance', formData.performance);
    data.append('treadDesign', formData.treadDesign);
    data.append('runFlat', String(formData.runFlat));
    data.append('threePMS', String(formData.threePMS));
    data.append('warranty', formData.warranty);
    data.append('treadLife', formData.treadLife);

    const existingPaths: string[] = [];
    const imageOrder: string[] = [];
    let newImageIndex = 0;
    productImages.forEach((item) => {
      if (item.kind === 'existing') {
        existingPaths.push(item.path);
        imageOrder.push(item.path);
      } else {
        data.append('images', item.file);
        imageOrder.push(`__new__:${newImageIndex}`);
        newImageIndex += 1;
      }
    });
    data.append('existingImages', JSON.stringify(existingPaths));
    data.append('imageOrder', JSON.stringify(imageOrder));

    try {
      if (editModel) {
        await dispatch(updateTireModel({ id: editModel.id, data })).unwrap();
      } else {
        await dispatch(createTireModel(data)).unwrap();
      }
      router.push('/admin/tire-models');
      router.refresh();
    } catch (err) {
      console.error('Failed to save tire model:', err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const cleanPath = path.startsWith('uploads/') ? path.replace('uploads/', '') : path;
    return `${baseUrl}/uploads/${cleanPath}`;
  };

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-[#1e2a4a]">
          {editModel ? 'Edit Tire Model' : 'Add New Tire Model'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Multi-Image Upload Area */}
        <div className="flex flex-col items-center justify-center space-y-6">
          <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Model Images</label>
          <p className="text-sm text-gray-500 -mt-2">Drag images to reorder. The first image is used as the primary photo.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-w-5xl">
            {productImages.map((item, index) => {
              const src = item.kind === 'existing' ? getImageUrl(item.path) : item.previewUrl;
              const isDragOver = dragOverImageIndex === index;
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={handleImageDragStart(index)}
                  onDragOver={handleImageDragOver(index)}
                  onDrop={handleImageDrop(index)}
                  onDragEnd={handleImageDragEnd}
                  className={`relative group aspect-square cursor-grab active:cursor-grabbing transition-all ${
                    isDragOver ? 'scale-[1.02]' : ''
                  }`}
                  title="Drag to reorder"
                >
                  <div
                    className={`w-full h-full rounded-2xl overflow-hidden bg-gray-50 shadow-sm border ${
                      isDragOver
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : item.kind === 'new'
                          ? 'border-2 border-blue-100 bg-blue-50/30'
                          : 'border border-gray-100'
                    }`}
                  >
                    <img src={src} alt={`Model ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                  </div>
                  <div className="absolute top-2 left-2 p-1 bg-black/45 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-black/50 text-white text-[11px] font-semibold">
                    {index + 1}
                  </span>
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => removeProductImage(item.id)}
                    className={`absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg border-2 border-white ${
                      item.kind === 'new' ? '' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-50 hover:border-blue-200 hover:text-[#3B5998] transition-all group"
            >
              <Upload className="h-6 w-6 text-gray-400 group-hover:text-[#3B5998] mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#3B5998]">Add Logo</span>
            </button>
          </div>
          
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Model Name</label>
              <input
                type="text"
                placeholder="Enter model name"
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5" ref={brandDropdownRef}>
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Brand</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                  className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-[16px] outline-none text-left flex items-center justify-between font-medium"
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
                        className={`px-5 py-3.5 cursor-pointer flex items-center justify-between hover:bg-gray-50 text-[15px] ${
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
                          className={`px-5 py-3.5 cursor-pointer flex items-center justify-between hover:bg-gray-50 text-[15px] ${
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
                        className="px-5 py-4 cursor-pointer flex items-center gap-2 hover:bg-blue-50 text-[15px] text-[#3B5998] font-bold transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add Brand
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Season</label>
              <select
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none"
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Performance</label>
              <select
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none"
                value={formData.performance}
                onChange={(e) => setFormData({ ...formData, performance: e.target.value })}
              >
                {performances.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tread Design</label>
              <input
                type="text"
                placeholder="Enter tread design"
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                value={formData.treadDesign}
                onChange={(e) => setFormData({ ...formData, treadDesign: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:bg-[#3B5998] checked:border-[#3B5998]" 
                    checked={formData.threePMS} 
                    onChange={(e) => setFormData({ ...formData, threePMS: e.target.checked })} 
                  />
                  <svg className="absolute left-0.5 top-0.5 h-4 w-4 fill-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-[#1e2a4a]">Three PMS</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-300 bg-white transition-all checked:bg-[#3B5998] checked:border-[#3B5998]" 
                    checked={formData.runFlat} 
                    onChange={(e) => setFormData({ ...formData, runFlat: e.target.checked })} 
                  />
                  <svg className="absolute left-0.5 top-0.5 h-4 w-4 fill-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                </div>
                <span className="text-[15px] font-medium text-[#1e2a4a]">Run Flat</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Warranty</label>
              <input
                type="text"
                placeholder="e.g. 50,000 miles"
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                value={formData.warranty}
                onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Tread Life</label>
              <input
                type="text"
                placeholder="Enter tread life"
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                value={formData.treadLife}
                onChange={(e) => setFormData({ ...formData, treadLife: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Description</label>
            <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
              <JoditEditor 
                value={formData.description} 
                config={editorConfig} 
                onBlur={(newContent) => setFormData({ ...formData, description: newContent })} 
              />
            </div>
          </div>


          <div className="flex items-center justify-end pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-[#1e2a4a] text-white rounded-2xl text-base font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {editModel ? 'Update Model' : 'Save Model'}
            </button>
          </div>
        </div>
      </form>

      {isManageBrandsOpen && (
        <ManageBrandsModal
          category="tire"
          onClose={() => setIsManageBrandsOpen(false)}
          onBrandsUpdated={fetchBrandsData}
        />
      )}
    </div>
  );
}
