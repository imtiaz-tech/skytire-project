'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Type } from 'lucide-react';
import { useAppDispatch } from '@/redux/hooks';
import { createRotatorHeadline, updateRotatorHeadline } from '@/features/rotator/slice';
import { RotatorHeadline } from '@/redux/types/rotatorTypes';
import toast from 'react-hot-toast';

interface RotatorHeadlineFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRecord?: RotatorHeadline | null;
}

const inputClass =
  'w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all outline-none';
const labelClass = 'block text-sm font-semibold text-gray-500 mb-1.5';

export default function RotatorHeadlineFormModal({
  open,
  onClose,
  onSuccess,
  editRecord,
}: RotatorHeadlineFormModalProps) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(editRecord);

  useEffect(() => {
    if (!open) return;
    setTitle(editRecord?.title ?? '');
  }, [open, editRecord]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Headline title is required');

    setSubmitting(true);
    try {
      if (isEdit && editRecord) {
        await dispatch(updateRotatorHeadline({ id: editRecord.id, data: { title } })).unwrap();
        toast.success('Headline updated successfully');
      } else {
        await dispatch(createRotatorHeadline({ title })).unwrap();
        toast.success('Headline created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to save headline');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div
        className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl shadow-blue-900/10 animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1e2a4a] rounded-2xl flex items-center justify-center text-white">
              <Type className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1e2a4a]">
              {isEdit ? 'Edit Headline' : 'Add New Headline'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className={labelClass}>Headline Title</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Enter headline title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-[#1e2a4a] hover:bg-gray-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
