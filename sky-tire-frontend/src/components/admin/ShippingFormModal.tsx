'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Truck, Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { createShipping, updateShipping } from '@/features/shipping/slice';
import { fetchAccessoryCategories } from '@/features/accessory-categories/slice';
import {
  Shipping,
  ShippingCategory,
  ShippingFormData,
} from '@/redux/types/shippingTypes';
import ManageAccessoryCategoriesModal from '@/components/admin/ManageAccessoryCategoriesModal';
import toast from 'react-hot-toast';

interface ShippingFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: ShippingCategory;
  isAccessoryMode: boolean;
  editRecord?: Shipping | null;
}

const emptyForm = (): ShippingFormData => ({
  size: '',
  accessoryCategoryId: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  shippingRate: '',
});

export default function ShippingFormModal({
  open,
  onClose,
  onSuccess,
  category,
  isAccessoryMode,
  editRecord,
}: ShippingFormModalProps) {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector((state) => state.accessoryCategories);
  const [formData, setFormData] = useState<ShippingFormData>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  const isEdit = Boolean(editRecord);
  const saveCategory: ShippingCategory = isAccessoryMode ? 'ACCESSORY' : category;

  useEffect(() => {
    if (open && isAccessoryMode) {
      dispatch(fetchAccessoryCategories());
    }
  }, [open, isAccessoryMode, dispatch]);

  useEffect(() => {
    if (!open) return;

    const source = editRecord;
    if (source) {
      setFormData({
        size: source.size || '',
        accessoryCategoryId: source.accessoryCategoryId || '',
        weight: String(source.weight),
        length: String(source.length),
        width: String(source.width),
        height: String(source.height),
        shippingRate: String(source.shippingRate),
      });
    } else {
      setFormData(emptyForm());
    }
  }, [open, isAccessoryMode, editRecord]);

  if (!open) return null;

  const categoryLabel = isAccessoryMode ? 'Accessories' : category.replace(/_/g, ' ');

  const validateForm = () => {
    if (isAccessoryMode) {
      if (!formData.accessoryCategoryId) return toast.error('Accessory category is required');
    } else if (!formData.size.trim()) {
      return toast.error('Size is required');
    }

    const fields = [
      { value: formData.weight, label: 'Weight' },
      { value: formData.length, label: 'Length' },
      { value: formData.width, label: 'Width' },
      { value: formData.height, label: 'Height' },
      { value: formData.shippingRate, label: 'Shipping rate' },
    ];
    for (const field of fields) {
      const num = parseFloat(field.value);
      if (!field.value || Number.isNaN(num) || num <= 0) {
        return toast.error(`${field.label} must be a positive number`);
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm() !== true) return;

    const payload = {
      ...(isAccessoryMode
        ? { accessoryCategoryId: formData.accessoryCategoryId }
        : { size: formData.size.trim() }),
      weight: parseFloat(formData.weight),
      length: parseFloat(formData.length),
      width: parseFloat(formData.width),
      height: parseFloat(formData.height),
      shippingRate: parseFloat(formData.shippingRate),
    };

    setSubmitting(true);
    try {
      if (isEdit && editRecord) {
        await dispatch(updateShipping({ id: editRecord.id, data: payload })).unwrap();
        toast.success('Shipping record updated successfully');
      } else {
        await dispatch(createShipping({ category: saveCategory, ...payload })).unwrap();
        toast.success('Shipping record created successfully');
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as string;
      toast.error(typeof err === 'string' ? err : 'Failed to save shipping record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCategoryCreated = (categoryId: string) => {
    setFormData((prev) => ({ ...prev, accessoryCategoryId: categoryId }));
    dispatch(fetchAccessoryCategories());
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
        <div
          className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
          onClick={onClose}
        />
        <div className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl shadow-blue-900/10 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#1e2a4a] rounded-2xl flex items-center justify-center text-white">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1e2a4a]">
                  {isEdit ? 'Edit Shipping' : 'Add Shipping'}
                </h2>
                <p className="text-sm text-gray-400 font-medium">Category: {categoryLabel}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative w-full md:col-span-2">
                {isAccessoryMode ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label htmlFor="accessoryCategoryId" className="text-[12px] font-medium text-gray-400">
                        Accessory Category
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsManageCategoriesOpen(true)}
                        className="text-blue-500 hover:text-blue-600 text-[13px] font-bold flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Category
                      </button>
                    </div>
                    <select
                      id="accessoryCategoryId"
                      className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50 appearance-none cursor-pointer"
                      value={formData.accessoryCategoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, accessoryCategoryId: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Accessory Category</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    {formData.size && (
                      <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
                        Size
                      </label>
                    )}
                    <input
                      type="text"
                      placeholder="Size"
                      className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      required
                    />
                  </>
                )}
              </div>

              <div className="relative w-full">
                {formData.weight && (
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
                    Weight
                  </label>
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Weight"
                  className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
              </div>

              <div className="relative w-full">
                {formData.shippingRate && (
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
                    Shipping Rate
                  </label>
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Shipping Rate"
                  className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={formData.shippingRate}
                  onChange={(e) => setFormData({ ...formData, shippingRate: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
              </div>

              <div className="relative w-full">
                {formData.length && (
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
                    Length
                  </label>
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Length"
                  className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={formData.length}
                  onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
              </div>

              <div className="relative w-full">
                {formData.width && (
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
                    Width
                  </label>
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Width"
                  className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={formData.width}
                  onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
              </div>

              <div className="relative w-full md:col-span-2">
                {formData.height && (
                  <label className="absolute -top-2.5 left-3 bg-white px-1 text-[12px] font-medium text-gray-400 z-10">
                    Height
                  </label>
                )}
                <input
                  type="number"
                  step="0.01"
                  placeholder="Height"
                  className="w-full px-4 py-3.5 bg-transparent border border-gray-200 rounded-xl text-[#1e2a4a] text-[16px] outline-none focus:ring-1 focus:ring-blue-500/50"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  onWheel={(e) => e.currentTarget.blur()}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 bg-gray-50 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-6 py-3.5 bg-[#1e2a4a] text-white rounded-2xl text-sm font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : isEdit ? 'Update Shipping' : 'Save Shipping'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ManageAccessoryCategoriesModal
        open={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesUpdated={() => dispatch(fetchAccessoryCategories())}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}
