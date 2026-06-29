'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2, Megaphone } from 'lucide-react';
import { useAppDispatch } from '@/redux/hooks';
import { createPromoBar, updatePromoBar } from '@/features/promo-bars/slice';
import { PromoBar, PromoBarFormData } from '@/redux/types/promoBarTypes';
import { inferLinkType } from '@/lib/promoBarValidation';
import toast from 'react-hot-toast';

interface PromoBarFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editRecord?: PromoBar | null;
}

const emptyForm = (): PromoBarFormData => ({
  text: '',
  boldText: '',
  bgColor: '#f2f3ee',
  textColor: 'black',
  boldColor: 'black',
  link: '',
  openInNewTab: false,
  isActive: true,
});

const inputClass =
  'w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all outline-none';
const labelClass = 'block text-sm font-semibold text-gray-500 mb-1.5';
const helperClass = 'text-xs text-gray-400 mt-1';
const helperClassMd = 'text-sm text-gray-400 mt-1';

export default function PromoBarFormModal({
  open,
  onClose,
  onSuccess,
  editRecord,
}: PromoBarFormModalProps) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<PromoBarFormData>(emptyForm());
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(editRecord);

  useEffect(() => {
    if (!open) return;
    if (editRecord) {
      setFormData({
        text: editRecord.text,
        boldText: editRecord.boldText,
        bgColor: editRecord.bgColor,
        textColor: editRecord.textColor,
        boldColor: editRecord.boldColor,
        link: editRecord.link,
        openInNewTab: editRecord.openInNewTab,
        isActive: editRecord.isActive,
      });
    } else {
      setFormData(emptyForm());
    }
  }, [open, editRecord]);

  if (!open) return null;

  const linkType = inferLinkType(formData.link);
  const linkHelper =
    linkType === 'internal'
      ? "Internal route (e.g., /tires) or external URL (e.g., https://example.com). Links starting with '/' are internal."
      : 'External URL will open based on the toggle below.';

  const handleColorChange = (
    field: 'bgColor' | 'textColor' | 'boldColor',
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim()) return toast.error('Text is required');
    if (!formData.boldText.trim()) return toast.error('Bold text is required');
    if (!formData.link.trim()) return toast.error('Link URL/Path is required');

    setSubmitting(true);
    try {
      if (isEdit && editRecord) {
        await dispatch(updatePromoBar({ id: editRecord.id, data: formData })).unwrap();
        toast.success('Promo bar updated successfully');
      } else {
        await dispatch(createPromoBar(formData)).unwrap();
        toast.success('Promo bar created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.error(typeof err === 'string' ? err : 'Failed to save promo bar');
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
      <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl shadow-blue-900/10 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#1e2a4a] rounded-2xl flex items-center justify-center text-white">
              <Megaphone className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1e2a4a]">
              {isEdit ? 'Edit Promo Bar' : 'Add New Promo Bar'}
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

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
          <div>
            <label className={labelClass}>Text</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Regular text content"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              required
            />
            <p className={helperClass}>Regular text content</p>
          </div>

          <div>
            <label className={labelClass}>Bold Text</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Bold text portion"
              value={formData.boldText}
              onChange={(e) => setFormData({ ...formData, boldText: e.target.value })}
              required
            />
            <p className={helperClassMd}>Bold/highlighted text portion</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'bgColor' as const, label: 'Background Color' },
              { key: 'textColor' as const, label: 'Text Color' },
              { key: 'boldColor' as const, label: 'Bold Text Color' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={
                      formData[key].startsWith('#') ? formData[key] : '#000000'
                    }
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    className={inputClass}
                    value={formData[key]}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className={labelClass}>Link URL/Path</label>
            <input
              type="text"
              className={inputClass}
              placeholder="/tires or https://example.com"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              required
            />
            <p className={helperClassMd}>{linkHelper}</p>
          </div>

          <div className="border border-gray-200 rounded-xl bg-white">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-medium text-[#1e2a4a]">Open in new tab</span>
              <div className="flex items-center gap-4 shrink-0">
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="openInNewTab"
                    checked={formData.openInNewTab === true}
                    onChange={() => setFormData({ ...formData, openInNewTab: true })}
                    className="text-[#1e2a4a]"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input
                    type="radio"
                    name="openInNewTab"
                    checked={formData.openInNewTab === false}
                    onChange={() => setFormData({ ...formData, openInNewTab: false })}
                    className="text-[#1e2a4a]"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
