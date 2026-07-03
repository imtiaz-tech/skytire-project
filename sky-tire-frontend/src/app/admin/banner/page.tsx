'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Clock,
  Type,
  Palette,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchBanner, saveBanner, uploadBannerImage } from '@/features/banner/slice';
import { BannerData } from '@/redux/types/bannerTypes';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '@/lib/bannerValidation';
import { getBannerImageUrl } from '@/lib/bannerImageUrl';
import BannerLivePreview from '@/components/admin/banner/BannerLivePreview';
import BannerSegmentEditor from '@/components/admin/banner/BannerSegmentEditor';
import toast from 'react-hot-toast';

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all outline-none';
const labelClass = 'block text-md font-semibold text-gray-500 mb-1.5';
const helperClass = 'text-xs text-gray-400 mt-1';

function CollapsibleSection({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-[#1e2a4a] font-semibold">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="px-6 pb-6 border-t border-gray-50">{children}</div>}
    </div>
  );
}

export default function BannerPage() {
  const dispatch = useAppDispatch();
  const { data, loading, saving, uploading } = useAppSelector((state) => state.banner);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BannerData>(data);
  const [bgOpen, setBgOpen] = useState(true);
  const [countdownOpen, setCountdownOpen] = useState(false);
  const [headlineOpen, setHeadlineOpen] = useState(true);
  const [subheadlineOpen, setSubheadlineOpen] = useState(true);
  const [buttonOpen, setButtonOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);

  const loadBanner = useCallback(() => {
    dispatch(fetchBanner());
  }, [dispatch]);

  useEffect(() => {
    loadBanner();
  }, [loadBanner]);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const updateForm = (patch: Partial<BannerData>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = async () => {
    try {
      await dispatch(saveBanner(form)).unwrap();
      toast.success('Banner saved successfully');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to save banner');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await dispatch(uploadBannerImage(file)).unwrap();
      updateForm({ backgroundImage: result.backgroundImage });
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to upload image');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const countdownLocal = toDatetimeLocalValue(form.countdownEndDate);

  if (loading && !form.headlineSegments.length) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <h1 className="text-2xl font-bold text-[#1e2a4a]">Banner Configuration</h1>
      </div>

      <BannerLivePreview banner={form} />

      <CollapsibleSection
        title="Background Image"
        icon={ImageIcon}
        open={bgOpen}
        onToggle={() => setBgOpen((v) => !v)}
      >
        <div className="pt-6 space-y-4">
          <h3 className="text-sm font-bold text-[#1e2a4a]">Upload Banner Background</h3>
          {form.backgroundImage && (
            <div>
              <p className="text-sm text-gray-500 mb-2">Current Image:</p>
              <img
                src={getBannerImageUrl(form.backgroundImage)}
                alt="Banner background"
                className="w-48 h-48 object-cover rounded-xl border border-gray-200"
              />
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#1e2a4a] text-[#1e2a4a] rounded-xl text-sm font-bold hover:bg-gray-50 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              Upload Image
            </button>
          </div>
          <p className={helperClass}>
            Accepted formats: JPG, PNG, WEBP (automatically converted to WEBP)
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Countdown Timer"
        icon={Clock}
        open={countdownOpen}
        onToggle={() => setCountdownOpen((v) => !v)}
      >
        <div className="pt-6 space-y-4">
          <h3 className="text-sm font-bold text-[#1e2a4a]">Set Countdown Target Date &amp; Time</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Countdown End Date &amp; Time</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={countdownLocal}
                onChange={(e) =>
                  updateForm({
                    countdownEndDate: fromDatetimeLocalValue(e.target.value),
                  })
                }
              />
              {form.countdownEndDate && (
                <p className={helperClass}>
                  Stored as UTC: {new Date(form.countdownEndDate).toISOString()}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>Timer Text</label>
              <input
                type="text"
                className={inputClass}
                value={form.countdownText}
                onChange={(e) => updateForm({ countdownText: e.target.value })}
              />
              <p className={helperClass}>
                Text displayed above the countdown timer (e.g., &apos;ENDS IN...&apos;)
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Main Headline"
        icon={Type}
        open={headlineOpen}
        onToggle={() => setHeadlineOpen((v) => !v)}
      >
        <div className="pt-6">
          <BannerSegmentEditor
            title="Main Headline"
            segments={form.headlineSegments}
            onChange={(headlineSegments) => updateForm({ headlineSegments })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Subheadline"
        icon={Type}
        open={subheadlineOpen}
        onToggle={() => setSubheadlineOpen((v) => !v)}
      >
        <div className="pt-6">
          <BannerSegmentEditor
            title="Subheadline"
            segments={form.subheadlineSegments}
            onChange={(subheadlineSegments) => updateForm({ subheadlineSegments })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Button Customization"
        icon={Palette}
        open={buttonOpen}
        onToggle={() => setButtonOpen((v) => !v)}
      >
        <div className="pt-6 space-y-4">
          <h3 className="text-sm font-bold text-[#1e2a4a]">Customize Button</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Button Text</label>
              <input
                type="text"
                className={inputClass}
                value={form.buttonText}
                onChange={(e) => updateForm({ buttonText: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Button Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.buttonColor.startsWith('#') ? form.buttonColor : '#184b99'}
                  onChange={(e) => updateForm({ buttonColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  className={inputClass}
                  value={form.buttonColor}
                  onChange={(e) => updateForm({ buttonColor: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Rating Section"
        icon={Star}
        open={ratingOpen}
        onToggle={() => setRatingOpen((v) => !v)}
      >
        <div className="pt-6 space-y-4">
          <h3 className="text-sm font-bold text-[#1e2a4a]">Customize Rating Section</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rating Value</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                className={inputClass}
                value={form.ratingValue}
                onChange={(e) => updateForm({ ratingValue: Number(e.target.value) })}
              />
              <p className={helperClass}>Rating value (0-5)</p>
            </div>
            <div>
              <label className={labelClass}>Rating Text</label>
              <input
                type="text"
                className={inputClass}
                value={form.ratingText}
                onChange={(e) => updateForm({ ratingText: e.target.value })}
              />
              <p className={helperClass}>Text displayed below the rating</p>
            </div>
            <div>
              <label className={labelClass}>Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    form.ratingTextColor.startsWith('#') ? form.ratingTextColor : '#ffffff'
                  }
                  onChange={(e) => updateForm({ ratingTextColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  className={inputClass}
                  value={form.ratingTextColor}
                  onChange={(e) => updateForm({ ratingTextColor: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Background Color</label>
              <input
                type="text"
                className={inputClass}
                value={form.ratingBgColor}
                onChange={(e) => updateForm({ ratingBgColor: e.target.value })}
              />
              <p className={helperClass}>
                Use rgba() or hex color (e.g., rgba(0, 0, 0, 0.6))
              </p>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex justify-end pt-2 pb-8 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </div>
  );
}
