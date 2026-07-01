'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RotateCw,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  Palette,
  Link2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  deleteRotatorHeadline,
  fetchRotator,
  reorderRotatorHeadlines,
  toggleRotatorHeadlineActive,
  updateRotatorAnimation,
  updateRotatorColors,
} from '@/features/rotator/slice';
import { RotatorColors, RotatorHeadline } from '@/redux/types/rotatorTypes';
import RotatorLivePreview from '@/components/admin/RotatorLivePreview';
import RotatorHeadlineFormModal from '@/components/admin/RotatorHeadlineFormModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import toast from 'react-hot-toast';

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all outline-none';
const labelClass = 'block text-md font-semibold text-gray-500 mb-1.5';
const helperClass = 'text-xs text-gray-400 mt-1';
const thClass =
  'px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap';

const COLOR_FIELDS: { key: keyof RotatorColors; label: string }[] = [
  { key: 'bgGradientStart', label: 'Background Gradient Start' },
  { key: 'bgGradientMiddle', label: 'Background Gradient Middle' },
  { key: 'bgGradientEnd', label: 'Background Gradient End' },
  { key: 'borderColor', label: 'Border Color' },
  { key: 'textColor', label: 'Text Color' },
  { key: 'glowColor', label: 'Glow Color' },
];

export default function RotatorPage() {
  const dispatch = useAppDispatch();
  const { colors, animation, headlines, loading, savingColors, savingAnimation } =
    useAppSelector((state) => state.rotator);

  const [colorForm, setColorForm] = useState<RotatorColors>(colors);
  const [animationForm, setAnimationForm] = useState({
    animationDuration: String(animation.animationDuration),
    animationCurve: animation.animationCurve,
    stayDuration: String(animation.stayDuration),
  });
  const [colorsOpen, setColorsOpen] = useState(true);
  const [animationOpen, setAnimationOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RotatorHeadline | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [localHeadlines, setLocalHeadlines] = useState<RotatorHeadline[]>([]);

  const loadRotator = useCallback(() => {
    dispatch(fetchRotator());
  }, [dispatch]);

  useEffect(() => {
    loadRotator();
  }, [loadRotator]);

  useEffect(() => {
    setColorForm(colors);
  }, [colors]);

  useEffect(() => {
    setAnimationForm({
      animationDuration: String(animation.animationDuration),
      animationCurve: animation.animationCurve,
      stayDuration: String(animation.stayDuration),
    });
  }, [animation]);

  useEffect(() => {
    setLocalHeadlines(headlines);
  }, [headlines]);

  const previewTitle = useMemo(() => {
    const active = localHeadlines.find((h) => h.isActive);
    return active?.title || localHeadlines[0]?.title || '';
  }, [localHeadlines]);

  const handleSaveColors = async () => {
    try {
      await dispatch(updateRotatorColors(colorForm)).unwrap();
      toast.success('Colors saved successfully');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to save colors');
    }
  };

  const handleSaveAnimation = async () => {
    try {
      await dispatch(
        updateRotatorAnimation({
          animationDuration: Number(animationForm.animationDuration),
          animationCurve: animationForm.animationCurve,
          stayDuration: Number(animationForm.stayDuration),
        })
      ).unwrap();
      toast.success('Animation settings saved successfully');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to save animation');
    }
  };

  const handleToggleActive = async (headline: RotatorHeadline) => {
    try {
      await dispatch(
        toggleRotatorHeadlineActive({ id: headline.id, isActive: !headline.isActive })
      ).unwrap();
      toast.success(`Headline ${headline.isActive ? 'deactivated' : 'activated'}`);
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to update status');
    }
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const items = [...localHeadlines];
    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    setLocalHeadlines(items);
    setDraggedId(null);

    try {
      await dispatch(reorderRotatorHeadlines(items.map((item) => item.id))).unwrap();
      toast.success('Headlines reordered');
    } catch (error: unknown) {
      setLocalHeadlines(headlines);
      toast.error(typeof error === 'string' ? error : 'Failed to reorder headlines');
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await dispatch(deleteRotatorHeadline(recordToDelete)).unwrap();
      toast.success('Headline deleted successfully');
      loadRotator();
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete headline');
    } finally {
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const updateColorField = (key: keyof RotatorColors, value: string) => {
    setColorForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <RotateCw className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Rotator Headlines</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditRecord(null);
            setIsFormOpen(true);
          }}
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add Headline
        </button>
      </div>

      <RotatorLivePreview colors={colorForm} title={previewTitle} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setColorsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-[#1e2a4a] font-semibold">
            <Palette className="h-4 w-4" />
            Color Settings
          </div>
          {colorsOpen ? ( 
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {colorsOpen && (
          <div className="px-6 pb-6 border-t border-gray-50">
            <div className="pt-6">
              <h3 className="text-sm font-bold text-[#1e2a4a] mb-4">Customize Rotator Colors</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {COLOR_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className={labelClass}>{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={colorForm[key].startsWith('#') ? colorForm[key] : '#000000'}
                        onChange={(e) => updateColorField(key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        className={inputClass}
                        value={colorForm[key]}
                        onChange={(e) => updateColorField(key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleSaveColors}
                  disabled={savingColors}
                  className="px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingColors && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Colors
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setAnimationOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-[#1e2a4a] font-semibold">
            <Link2 className="h-4 w-4" />
            Animation Settings
          </div>
          {animationOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {animationOpen && (
          <div className="px-6 pb-6 border-t border-gray-50">
            <div className="pt-6">
              <h3 className="text-md font-bold text-[#1e2a4a] mb-4">Customize Animation</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Animation Duration (seconds)</label>
                  <input
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    className={inputClass}
                    value={animationForm.animationDuration}
                    onChange={(e) =>
                      setAnimationForm((prev) => ({
                        ...prev,
                        animationDuration: e.target.value,
                      }))
                    }
                  />
                  <p className={helperClass}>
                    How long the slide transition takes (0.1-10 seconds)
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Animation Curve (cubic-bezier)</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={animationForm.animationCurve}
                    onChange={(e) =>
                      setAnimationForm((prev) => ({
                        ...prev,
                        animationCurve: e.target.value,
                      }))
                    }
                  />
                  <p className={helperClass}>
                    Format: x1, y1, x2, y2 (e.g., &apos;0.68, -0.55, 0.265, 1.55&apos;)
                  </p>
                </div>
                <div>
                  <label className={labelClass}>Stay Duration (seconds)</label>
                  <input
                    type="number"
                    min={0.5}
                    max={30}
                    step={0.1}
                    className={inputClass}
                    value={animationForm.stayDuration}
                    onChange={(e) =>
                      setAnimationForm((prev) => ({
                        ...prev,
                        stayDuration: e.target.value,
                      }))
                    }
                  />
                  <p className={helperClass}>
                    How long each headline stays visible (0.5-30 seconds)
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={handleSaveAnimation}
                  disabled={savingAnimation}
                  className="px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingAnimation && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Animation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className={`${thClass} w-12`} />
                <th className={thClass}>Headline</th>
                <th className={thClass}>Active</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : localHeadlines.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-semibold">No headlines found</p>
                  </td>
                </tr>
              ) : (
                localHeadlines.map((headline) => (
                  <tr
                    key={headline.id}
                    draggable
                    onDragStart={() => setDraggedId(headline.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(headline.id)}
                    className={`hover:bg-gray-50/50 transition-all ${
                      draggedId === headline.id ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1"
                        aria-label="Drag to reorder"
                      >
                        <GripVertical className="h-5 w-5" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-[#1e2a4a] font-medium">{headline.title}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(headline)}
                        className="transition-colors"
                        title={headline.isActive ? 'Active' : 'Inactive'}
                      >
                        {headline.isActive ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditRecord(headline);
                            setIsFormOpen(true);
                          }}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordToDelete(headline.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="w-10 h-10 bg-red-50 text-[#FF5A5F] rounded-full flex items-center justify-center hover:bg-[#FF5A5F] hover:text-white transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && localHeadlines.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-50 text-sm text-gray-400">
            Drag and drop rows to reorder headlines
          </div>
        )}
      </div>

      <RotatorHeadlineFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadRotator}
        editRecord={editRecord}
      />

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Headline"
        message="Are you sure you want to delete this headline? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
