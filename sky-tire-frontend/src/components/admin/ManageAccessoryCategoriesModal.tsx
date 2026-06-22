'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Plus, Tags } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  createAccessoryCategory,
  fetchAccessoryCategories,
} from '@/features/accessory-categories/slice';
import toast from 'react-hot-toast';

interface ManageAccessoryCategoriesModalProps {
  open: boolean;
  onClose: () => void;
  onCategoriesUpdated?: () => void;
  onCategoryCreated?: (categoryId: string, categoryName: string) => void;
}

export default function ManageAccessoryCategoriesModal({
  open,
  onClose,
  onCategoriesUpdated,
  onCategoryCreated,
}: ManageAccessoryCategoriesModalProps) {
  const dispatch = useAppDispatch();
  const { categories, loading } = useAppSelector((state) => state.accessoryCategories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(fetchAccessoryCategories());
    }
  }, [open, dispatch]);

  if (!open) return null;

  const handleAdd = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Category name is required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await dispatch(createAccessoryCategory(name)).unwrap();
      setNewCategoryName('');
      toast.success('Accessory category created');
      onCategoryCreated?.(created.id, created.name);
      onCategoriesUpdated?.();
    } catch (error: unknown) {
      const err = error as string;
      toast.error(typeof err === 'string' ? err : 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1e2a4a] rounded-2xl flex items-center justify-center text-white">
              <Tags className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1e2a4a]">Manage Accessory Categories</h2>
              <p className="text-sm text-gray-400 font-medium">Shared across Shipping and Accessories</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="New category name"
              className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl text-[#1e2a4a] outline-none focus:ring-1 focus:ring-blue-500/50"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleAdd();
                }
              }}
            />
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={submitting}
              className="px-5 py-3.5 bg-[#1e2a4a] text-white rounded-xl font-bold flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </button>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#1e2a4a]" />
              </div>
            ) : categories.length === 0 ? (
              <p className="py-12 text-center text-gray-400 font-medium">No categories yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {categories.map((category) => (
                  <li key={category.id} className="px-5 py-4 text-[15px] font-medium text-[#1e2a4a]">
                    {category.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
