'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createTireModel, updateTireModel } from '@/redux/slices/tireModelsSlice';
import { TireModel } from '@/redux/types/tireModelTypes';
import { ArrowLeft, Upload, X, Loader2, Plus, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

interface TireModelFormProps {
  editModel?: TireModel;
}

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
  
  // Images State
  const [previews, setPreviews] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);


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

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get('/api/admin/brands/dropdown');
        setBrands(response.data);
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
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
      setExistingImages(editModel.images || []);
    }
  }, [editModel]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setSelectedFiles(prev => [...prev, ...files]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewImage = (index: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const removeExistingImage = (index: number) => {
    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
  };



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
    
    data.append('existingImages', JSON.stringify(existingImages));
    selectedFiles.forEach((file) => {
      data.append('images', file);
    });

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
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full max-w-5xl">
            {existingImages.map((img, index) => (
              <div key={`existing-${index}`} className="relative group aspect-square">
                <div className="w-full h-full border border-gray-100 rounded-2xl overflow-hidden bg-gray-50 shadow-sm">
                  <img src={getImageUrl(img)} alt="Model" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg border-2 border-white opacity-0 group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

            {previews.map((url, index) => (
              <div key={`new-${index}`} className="relative group aspect-square animate-in zoom-in-95 duration-200">
                <div className="w-full h-full border-2 border-blue-100 rounded-2xl overflow-hidden bg-blue-50/30">
                  <img src={url} alt="New Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg border-2 border-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}

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

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Brand</label>
              <select
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none"
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                required
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.brandName}
                  </option>
                ))}
              </select>
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
    </div>
  );
}
