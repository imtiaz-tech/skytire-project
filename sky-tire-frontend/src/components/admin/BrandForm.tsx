'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createBrand, updateBrand } from '@/redux/slices/brandsSlice';
import { Brand, BrandCategory } from '@/redux/types/brandTypes';
import { ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

interface BrandFormProps {
  editBrand?: Brand;
}

const categories: { label: string; value: BrandCategory }[] = [
  { label: 'Tire', value: 'tire' },
  { label: 'Wheel', value: 'wheel' },
  { label: 'Wire Wheel', value: 'wire_wheel' },
  { label: 'Accessory', value: 'accessory' },
  { label: 'Bolt on Wheels', value: 'bolt_on_wheels' },
];

export default function BrandForm({ editBrand }: BrandFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  
  // Image previews
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  // Selected files
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [selectedCover, setSelectedCover] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    brandName: '',
    category: 'tire' as BrandCategory,
    description: '',
    isFeatured: false,
  });

  useEffect(() => {
    if (editBrand) {
      setFormData({
        brandName: editBrand.brandName,
        category: editBrand.category,
        description: editBrand.description || '',
        isFeatured: editBrand.isFeatured,
      });
      
      const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace('/api', '');
      
      if (editBrand.brandLogo) {
        const cleanPath = editBrand.brandLogo.startsWith('uploads/') ? editBrand.brandLogo.replace('uploads/', '') : editBrand.brandLogo;
        setLogoPreview(`${baseUrl}/uploads/${cleanPath}`);
      }
      if (editBrand.coverPhoto) {
        const cleanPath = editBrand.coverPhoto.startsWith('uploads/') ? editBrand.coverPhoto.replace('uploads/', '') : editBrand.coverPhoto;
        setCoverPreview(`${baseUrl}/uploads/${cleanPath}`);
      }
    }
  }, [editBrand]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedCover(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setSelectedLogo(null);
    setLogoPreview(null);
  };

  const handleRemoveCover = () => {
    setSelectedCover(null);
    setCoverPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('brandName', formData.brandName);
    data.append('category', formData.category);
    data.append('description', formData.description);
    data.append('isFeatured', String(formData.isFeatured));
    
    if (selectedLogo) {
      data.append('brandLogo', selectedLogo);
    }
    if (selectedCover) {
      data.append('coverPhoto', selectedCover);
    }

    try {
      if (editBrand) {
        await dispatch(updateBrand({ id: editBrand.id, formData: data })).unwrap();
      } else {
        await dispatch(createBrand(data)).unwrap();
      }
      router.push('/admin/brands');
      router.refresh();
    } catch (err) {
      console.error('Failed to save brand:', err);
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
          {editBrand ? 'Edit Brand' : 'Add New Brand'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand Logo Upload */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Brand Logo</label>
            <div className="relative group">
              <div className={`w-48 h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${
                logoPreview ? 'border-transparent' : 'border-gray-200 bg-gray-50/50 group-hover:bg-gray-50 group-hover:border-blue-200'
              }`}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-[#3B5998]">
                    <Upload className="h-8 w-8 mb-2 opacity-50 group-hover:opacity-100" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Add Logo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleLogoChange}
                  required={!editBrand}
                />
              </div>
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-3 -right-3 p-1.5 bg-gray-500 text-white rounded-full hover:bg-red-500 transition-all shadow-lg border-2 border-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Cover Photo Upload */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Cover Photo</label>
            <div className="relative group w-full max-w-sm">
              <div className={`w-full aspect-video border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${
                coverPreview ? 'border-transparent' : 'border-gray-200 bg-gray-50/50 group-hover:bg-gray-50 group-hover:border-blue-200'
              }`}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400 group-hover:text-[#3B5998]">
                    <Upload className="h-8 w-8 mb-2 opacity-50 group-hover:opacity-100" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Add Cover Photo</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleCoverChange}
                />
              </div>
              {coverPreview && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute -top-3 -right-3 p-1.5 bg-gray-500 text-white rounded-full hover:bg-red-500 transition-all shadow-lg border-2 border-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Brand Name</label>
              <input
                type="text"
                placeholder="Enter brand name"
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Category</label>
              <select
                className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium appearance-none"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as BrandCategory })}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Description</label>
            <textarea
              placeholder="Enter brand description..."
              rows={4}
              className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-50">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white transition-all checked:bg-[#3B5998] checked:border-[#3B5998]"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                />
                <svg className="absolute left-1 h-4 w-4 fill-white opacity-0 transition-opacity peer-checked:opacity-100" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-[#1e2a4a] group-hover:text-blue-600 transition-colors">Featured Brand</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-[#3B5998] text-white rounded-2xl text-base font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {editBrand ? 'Update Brand' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
