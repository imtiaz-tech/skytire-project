'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createTireSize, updateTireSize } from '@/redux/slices/tireSizesSlice';
import { TireSize } from '@/redux/types/tireSizeTypes';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import axios from 'axios';

interface TireSizeFormProps {
  editSize?: TireSize;
}

const vehicleTypes = [
  'Passenger',
  'Light Truck',
  'SUV',
  'Truck',
  'Commercial',
  'Performance',
  'Off-Road',
];

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const sidewallOptions = [
  'Black Wall',
  'White Wall',
];

export default function TireSizeForm({ editSize }: TireSizeFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<{ id: string; modelName: string; brand?: { brandName: string } }[]>([]);

  // Keywords State
  const [keywordArray, setKeywordArray] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');

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
    status: 'active',
    vehicleType: '',
    sidewall: '',
  });

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get('/api/admin/tire-models/dropdown');
        setModels(response.data);
      } catch (error) {
        console.error('Error fetching tire models:', error);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    if (editSize) {
      setFormData({
        modelId: editSize.modelId,
        tireSize: editSize.tireSize || '',
        tireWidth: editSize.tireWidth || '',
        aspectRatio: editSize.aspectRatio || '',
        rimDiameter: editSize.rimDiameter || '',
        loadIndex: editSize.loadIndex || '',
        speedRating: editSize.speedRating || '',
        loadRange: editSize.loadRange || '',
        inflationPressure: editSize.inflationPressure || '',
        tireWeight: editSize.tireWeight || '',
        shippingDimensions: editSize.shippingDimensions || '',
        utqg: editSize.utqg || '',
        seoTitle: editSize.seoTitle || '',
        metaDescription: editSize.metaDescription || '',
        status: editSize.status || 'active',
        vehicleType: editSize.vehicleType || '',
        sidewall: editSize.sidewall || '',
      });

      if (editSize.keywords) {
        try {
          if (editSize.keywords.startsWith('[')) {
            setKeywordArray(JSON.parse(editSize.keywords));
          } else {
            setKeywordArray(editSize.keywords.split(',').map(k => k.trim()).filter(Boolean));
          }
        } catch (e) {
          setKeywordArray(editSize.keywords.split(',').map(k => k.trim()).filter(Boolean));
        }
      }
    }
  }, [editSize]);

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

    const submitData = {
      ...formData,
      keywords: JSON.stringify(keywordArray),
    };

    try {
      if (editSize) {
        await dispatch(updateTireSize({ id: editSize.id, data: submitData })).unwrap();
      } else {
        await dispatch(createTireSize(submitData)).unwrap();
      }
      router.push('/admin/tire-sizes');
      router.refresh();
    } catch (err) {
      console.error('Failed to save tire size:', err);
    } finally {
      setLoading(false);
    }
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
          {editSize ? 'Edit Tire Size' : 'Add New Tire Size'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {/* Row 1: Tire Model & Tire Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative w-full">
              {formData.modelId && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Tire Model</label>}
              <select
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none"
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                required
              >
                <option value="">Tire Model</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.modelName}{model.brand ? ` (${model.brand.brandName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full">
              {formData.tireSize && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Tire Size</label>}
              <input
                type="text"
                placeholder="Tire Size (e.g. 225/45R17)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.tireSize}
                onChange={(e) => setFormData({ ...formData, tireSize: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Row 2: Tire Width, Aspect Ratio, Rim Diameter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.tireWidth && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Tire Width</label>}
              <input
                type="text"
                placeholder="Tire Width (e.g. 225)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.tireWidth}
                onChange={(e) => setFormData({ ...formData, tireWidth: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.aspectRatio && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Aspect Ratio</label>}
              <input
                type="text"
                placeholder="Aspect Ratio (e.g. 45)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.aspectRatio}
                onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.rimDiameter && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Rim Diameter</label>}
              <input
                type="text"
                placeholder="Rim Diameter (e.g. 17)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.rimDiameter}
                onChange={(e) => setFormData({ ...formData, rimDiameter: e.target.value })}
              />
            </div>
          </div>

          {/* Row 3: Load Index, Speed Rating, Load Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.loadIndex && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Load Index</label>}
              <input
                type="text"
                placeholder="Load Index (e.g. 91)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.loadIndex}
                onChange={(e) => setFormData({ ...formData, loadIndex: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.speedRating && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Speed Rating</label>}
              <input
                type="text"
                placeholder="Speed Rating (e.g. W)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.speedRating}
                onChange={(e) => setFormData({ ...formData, speedRating: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.loadRange && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Load Range</label>}
              <input
                type="text"
                placeholder="Load Range (e.g. SL)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.loadRange}
                onChange={(e) => setFormData({ ...formData, loadRange: e.target.value })}
              />
            </div>
          </div>

          {/* Row 4: Inflation Pressure, Tire Weight, Shipping Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.inflationPressure && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Inflation Pressure</label>}
              <input
                type="text"
                placeholder="Inflation Pressure (e.g. 36 PSI)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.inflationPressure}
                onChange={(e) => setFormData({ ...formData, inflationPressure: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.tireWeight && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Tire Weight</label>}
              <input
                type="text"
                placeholder="Tire Weight (e.g. 22 lbs)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.tireWeight}
                onChange={(e) => setFormData({ ...formData, tireWeight: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.shippingDimensions && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Shipping Dimensions</label>}
              <input
                type="text"
                placeholder="Shipping Dimensions (e.g. 25x25x10 in)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.shippingDimensions}
                onChange={(e) => setFormData({ ...formData, shippingDimensions: e.target.value })}
              />
            </div>
          </div>

          {/* Row 5: UTQG, Vehicle Type, Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative w-full">
              {formData.utqg && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">UTQG</label>}
              <input
                type="text"
                placeholder="UTQG (e.g. 500 A A)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
                value={formData.utqg}
                onChange={(e) => setFormData({ ...formData, utqg: e.target.value })}
              />
            </div>

            <div className="relative w-full">
              {formData.vehicleType && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Vehicle Type</label>}
              <select
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none"
                value={formData.vehicleType}
                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
              >
                <option value="">Vehicle Type</option>
                {vehicleTypes.map((vt) => (
                  <option key={vt} value={vt}>{vt}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full">
              {formData.status && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Status</label>}
              <select
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Sidewall */}
          <div className="relative w-full">
            {formData.sidewall && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Sidewall</label>}
            <select
              className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none appearance-none"
              value={formData.sidewall}
              onChange={(e) => setFormData({ ...formData, sidewall: e.target.value })}
            >
              <option value="">Sidewall</option>
              {sidewallOptions.map((sw) => (
                <option key={sw} value={sw}>{sw}</option>
              ))}
            </select>
          </div>

          {/* Row 7: Keywords */}
          <div className="space-y-3">
            <div className="relative w-full">
              {keywordArray.length > 0 && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Keywords</label>}
              <input 
                type="text"
                placeholder="Type keywords and press Enter or semi-colon (;)"
                className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none" 
                value={keywordInput} 
                onChange={(e) => setKeywordInput(e.target.value)} 
                onKeyDown={handleKeywordKeyDown}
              />
            </div>
            {keywordArray.length > 0 && (
              <div className="flex flex-wrap gap-2 px-1">
                {keywordArray.map((kw, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#1e2a4a] text-[13px] font-bold rounded-full border border-blue-100 shadow-sm animate-in zoom-in-95 duration-150">
                    <span>{kw}</span>
                    <button type="button" onClick={() => removeKeyword(kw)} className="text-blue-400 hover:text-blue-600 focus:outline-none flex-shrink-0">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 8: SEO Title */}
          <div className="relative w-full">
            {formData.seoTitle && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">SEO Title</label>}
            <input
              type="text"
              placeholder="SEO Title"
              className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none"
              value={formData.seoTitle}
              onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            />
          </div>

          {/* Row 9: Meta Description */}
          <div className="relative w-full">
            {formData.metaDescription && <label className="absolute -top-2.5 left-3 bg-[#f8f9fa] px-1 text-[12px] font-medium text-gray-400 z-10">Meta Description</label>}
            <textarea
              placeholder="Meta Description"
              rows={3}
              className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none"
              value={formData.metaDescription}
              onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-[#1e2a4a] text-white rounded-lg text-base font-bold hover:bg-opacity-90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {editSize ? 'Update Size' : 'Save Size'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
