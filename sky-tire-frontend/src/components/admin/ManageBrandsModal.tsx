'use client';

import React, { useState, useEffect } from 'react';
import { X, Pencil, Trash, Loader2, Plus } from 'lucide-react';
import axios from 'axios';
import ConfirmModal from '@/components/common/ConfirmModal';

interface ManageBrandsModalProps {
  category: string;
  onClose: () => void;
  onBrandsUpdated?: () => void;
}

interface BrandItem {
  id: string;
  brandName: string;
  category: string;
}

export default function ManageBrandsModal({ category, onClose, onBrandsUpdated }: ManageBrandsModalProps) {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandImage, setNewBrandImage] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/admin/brands/manage?category=${category}`);
      setBrands(res.data || []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [category]);

  const handleAdd = async () => {
    if (!newBrandName.trim()) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('brandName', newBrandName.trim());
      formData.append('category', category);
      if (newBrandImage) {
        formData.append('brandLogo', newBrandImage);
      }

      await axios.post('/api/admin/brands/manage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewBrandName('');
      setNewBrandImage(null);
      await fetchBrands();
      onBrandsUpdated?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to add brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    try {
      await axios.put(`/api/admin/brands/manage/${id}`, {
        brandName: editingName.trim(),
      });
      setEditingId(null);
      await fetchBrands();
      onBrandsUpdated?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`/api/admin/brands/manage/${deleteConfirmId}`);
      setDeleteConfirmId(null);
      await fetchBrands();
      onBrandsUpdated?.();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm lg:pl-[280px]">
      <div className="bg-white rounded-xl w-full max-w-[600px] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-[#1e2a4a]">Manage Brands</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Add New Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="New Brand Name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-[#1e2a4a]"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={!newBrandName.trim() || isSubmitting}
                className="px-6 py-3 bg-[#e8edf5] text-[#3B5998] font-medium rounded-lg hover:bg-[#d8e0ee] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="file"
                  id="brandImageUpload"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewBrandImage(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="brandImageUpload"
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-500">
                    {newBrandImage ? newBrandImage.name : 'Upload Brand Logo (Optional)'}
                  </span>
                </label>
              </div>
              {newBrandImage && (
                <button
                  onClick={() => setNewBrandImage(null)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* List Brands */}
          <div className="space-y-1">
            {loading && brands.length === 0 ? (
              <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : (
              brands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between py-3 px-2 group hover:bg-gray-50 rounded-lg transition-colors">
                  {editingId === brand.id ? (
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-4 py-2 border border-blue-500 rounded-lg text-[15px] focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(brand.id)}
                      />
                      <button 
                        onClick={() => handleSaveEdit(brand.id)}
                        className="px-5 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 text-[14px]"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-blue-500 font-medium text-[14px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-[16px] text-[#1e2a4a]">{brand.brandName}</span>
                      <div className="flex items-center gap-4 transition-opacity">
                        <button 
                          onClick={() => { setEditingId(brand.id); setEditingName(brand.brandName); }}
                          className="text-[#3B5998] hover:text-[#2a3b69]"
                        >
                          <Pencil className="h-[18px] w-[18px]" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(brand.id)}
                          className="text-[#ff5a5f] hover:text-red-600"
                        >
                          <Trash className="h-[18px] w-[18px]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
            {brands.length === 0 && !loading && (
              <p className="text-gray-400 text-center py-4">No brands found.</p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="text-blue-500 font-bold hover:text-blue-600"
          >
            Close
          </button>
        </div>
      </div>

      <ConfirmModal
        open={!!deleteConfirmId}
        title="Delete Brand"
        message="Are you sure you want to delete this brand? This will unlink any products currently using it."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}
