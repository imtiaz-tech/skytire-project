'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  Settings,
  ChevronDown,
  ChevronUp,
  Link2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  deletePromoBar,
  fetchPromoBars,
  reorderPromoBars,
  togglePromoBarActive,
  updatePromoBarSettings,
} from '@/features/promo-bars/slice';
import { PromoBar } from '@/redux/types/promoBarTypes';
import { resolveCssColor } from '@/lib/promoBarValidation';
import PromoBarFormModal from '@/components/admin/PromoBarFormModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import toast from 'react-hot-toast';

export default function PromoBarsPage() {
  const dispatch = useAppDispatch();
  const { promoBars, settings, loading, savingSettings } = useAppSelector(
    (state) => state.promoBars
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PromoBar | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoplayDelay, setAutoplayDelay] = useState('3000');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [localBars, setLocalBars] = useState<PromoBar[]>([]);

  const loadPromoBars = useCallback(() => {
    dispatch(fetchPromoBars());
  }, [dispatch]);

  useEffect(() => {
    loadPromoBars();
  }, [loadPromoBars]);

  useEffect(() => {
    setLocalBars(promoBars);
  }, [promoBars]);

  useEffect(() => {
    setAutoplayDelay(String(settings.autoplayDelay));
  }, [settings.autoplayDelay]);

  const openAddModal = () => {
    setEditRecord(null);
    setIsFormOpen(true);
  };

  const openEditModal = (record: PromoBar) => {
    setEditRecord(record);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await dispatch(deletePromoBar(recordToDelete)).unwrap();
      toast.success('Promo bar deleted successfully');
      loadPromoBars();
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete promo bar');
    } finally {
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const handleSaveSettings = async () => {
    const delay = Number(autoplayDelay);
    if (Number.isNaN(delay) || delay < 500 || delay > 30000) {
      toast.error('Autoplay delay must be between 500 and 30000 milliseconds');
      return;
    }

    try {
      await dispatch(updatePromoBarSettings(delay)).unwrap();
      toast.success('Settings saved successfully');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to save settings');
    }
  };

  const handleToggleActive = async (bar: PromoBar) => {
    try {
      await dispatch(
        togglePromoBarActive({ id: bar.id, isActive: !bar.isActive })
      ).unwrap();
      toast.success(`Promo bar ${bar.isActive ? 'deactivated' : 'activated'}`);
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to update status');
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const items = [...localBars];
    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    setLocalBars(items);
    setDraggedId(null);

    try {
      await dispatch(reorderPromoBars(items.map((item) => item.id))).unwrap();
      toast.success('Promo bars reordered');
    } catch (error: unknown) {
      setLocalBars(promoBars);
      toast.error(typeof error === 'string' ? error : 'Failed to reorder promo bars');
    }
  };

  const thClass =
    'px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <Megaphone className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-[#1e2a4a]">Promo Bar Management</h1>
          </div>
          <p className="text-sm text-gray-400 mt-2 ml-[52px]">
            Manage promotional banners displayed in the header
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Add Promo Bar
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-[#1e2a4a] font-semibold">
            <Settings className="h-4 w-4" />
            Settings
          </div>
          {settingsOpen ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </button>

        {settingsOpen && (
          <div className="px-6 pb-6 border-t border-gray-50">
            <div className="pt-6 max-w-md">
              <h3 className="text-sm font-bold text-[#1e2a4a] mb-4">Promo Bar Settings</h3>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Autoplay Delay (milliseconds)
              </label>
              <input
                type="number"
                min={500}
                max={30000}
                step={100}
                value={autoplayDelay}
                onChange={(e) => setAutoplayDelay(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-base text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                How long each promo bar is displayed before switching (500-30000ms)
              </p>
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-[#1e2a4a] text-white rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-60"
                >
                  {savingSettings && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Settings
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
                <th className={thClass}>Preview</th>
                <th className={thClass}>Link</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin mx-auto" />
                  </td>
                </tr>
              ) : localBars.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <p className="text-gray-400 font-semibold">No promo bars found</p>
                  </td>
                </tr>
              ) : (
                localBars.map((bar) => (
                  <tr
                    key={bar.id}
                    draggable
                    onDragStart={() => handleDragStart(bar.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(bar.id)}
                    className={`hover:bg-gray-50/50 transition-all ${
                      draggedId === bar.id ? 'opacity-50' : ''
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
                    <td className="px-6 py-4 min-w-[320px]">
                      <div
                        className="rounded-lg px-4 py-2.5 text-sm"
                        style={{
                          backgroundColor: resolveCssColor(bar.bgColor),
                          color: resolveCssColor(bar.textColor),
                        }}
                      >
                        {bar.text}{' '}
                        <span
                          className="font-bold px-1.5 py-0.5 border border-dashed rounded"
                          style={{
                            color: resolveCssColor(bar.boldColor),
                            borderColor: resolveCssColor(bar.boldColor),
                          }}
                        >
                          {bar.boldText}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-[#1e2a4a] truncate">{bar.link}</span>
                        <span className="inline-flex shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 capitalize">
                          {bar.linkType}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(bar)}
                        className="transition-colors"
                        title={bar.isActive ? 'Active' : 'Inactive'}
                      >
                        {bar.isActive ? (
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
                          onClick={() => openEditModal(bar)}
                          className="w-10 h-10 bg-gray-50 text-[#1e2a4a] rounded-full flex items-center justify-center hover:bg-[#1e2a4a] hover:text-white transition-all"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordToDelete(bar.id);
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

        {!loading && localBars.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-50 text-sm text-gray-400">
            Drag and drop rows to reorder promo bars
          </div>
        )}
      </div>

      <PromoBarFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadPromoBars}
        editRecord={editRecord}
      />

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete Promo Bar"
        message="Are you sure you want to delete this promo bar? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
