'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/redux/hooks';
import { createInventorySource, updateInventorySource } from '@/redux/slices/inventorySourcesSlice';
import { InventorySource } from '@/redux/types/inventorySourceTypes';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventorySourceFormProps {
  editSource?: InventorySource;
}

export default function InventorySourceForm({ editSource }: InventorySourceFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    source: '',
  });

  useEffect(() => {
    if (editSource) {
      setFormData({
        source: editSource.source,
      });
    }
  }, [editSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source.trim()) {
      return toast.error('Source name is required');
    }

    setLoading(true);

    try {
      if (editSource) {
        await dispatch(updateInventorySource({ id: editSource.id, data: formData })).unwrap();
        toast.success('Inventory Source updated successfully');
      } else {
        await dispatch(createInventorySource(formData)).unwrap();
        toast.success('Inventory Source created successfully');
      }
      router.push('/admin/inventory-sources');
      router.refresh();
    } catch (err: any) {
      console.error('Failed to save inventory source:', err);
      toast.error(err || 'Failed to save inventory source');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 bg-white border border-gray-100 rounded-xl text-[#1e2a4a] hover:bg-gray-50 transition-all shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">
            {editSource ? 'Edit Inventory Source' : 'Add New Inventory Source'}
          </h1>
          <p className="text-gray-400 text-sm font-medium mt-1">
            {editSource ? 'Update the details of your inventory source' : 'Create a new source for your inventory tracking'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-gray-400 uppercase tracking-wider ml-1">Source Name</label>
            <input
              type="text"
              placeholder="e.g. Local Warehouse, Supplier A, etc."
              className="w-full px-5 py-4 bg-gray-50/50 border-none rounded-2xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-[#1e2a4a] text-white rounded-2xl text-base font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {editSource ? 'Update Source' : 'Save Source'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
