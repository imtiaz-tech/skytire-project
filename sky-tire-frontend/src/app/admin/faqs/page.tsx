'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CircleHelp, Loader2, RotateCcw, Save } from 'lucide-react';
import {
  MAIN_PAGE_FAQ_CATEGORIES,
  MainPageFaqCategory,
  getFaqEditorConfig,
} from '@/lib/faqEditor';

const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

type FaqState = Record<MainPageFaqCategory, string>;

const emptyFaqs = (): FaqState =>
  Object.fromEntries(MAIN_PAGE_FAQ_CATEGORIES.map((c) => [c.key, ''])) as FaqState;

export default function MainPageFaqsPage() {
  const [activeCategory, setActiveCategory] = useState<MainPageFaqCategory>('tires');
  const [savedFaqs, setSavedFaqs] = useState<FaqState>(emptyFaqs);
  const [draftFaqs, setDraftFaqs] = useState<FaqState>(emptyFaqs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editorConfig = useMemo(() => getFaqEditorConfig(), []);

  const activeMeta = MAIN_PAGE_FAQ_CATEGORIES.find((c) => c.key === activeCategory)!;
  const draftContent = draftFaqs[activeCategory] || '';
  const savedContent = savedFaqs[activeCategory] || '';
  const isDirty = draftContent !== savedContent;

  const loadFaqs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/main-page-faqs');
      const next = emptyFaqs();
      const faqs = res.data?.faqs || {};
      for (const cat of MAIN_PAGE_FAQ_CATEGORIES) {
        next[cat.key] = faqs[cat.key]?.content || '';
      }
      setSavedFaqs(next);
      setDraftFaqs(next);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/admin/main-page-faqs', {
        category: activeCategory,
        content: draftContent,
      });
      const content = res.data?.content || '';
      setSavedFaqs((prev) => ({ ...prev, [activeCategory]: content }));
      setDraftFaqs((prev) => ({ ...prev, [activeCategory]: content }));
      toast.success(`${activeMeta.label} FAQs saved`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to save FAQs');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDraftFaqs((prev) => ({ ...prev, [activeCategory]: savedContent }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-[#1e2a4a] flex items-center gap-3">
          <CircleHelp className="h-7 w-7 text-[#1e78ff]" />
          Main Page FAQs
        </h1>
        <p className="mt-2 text-[15px] text-gray-500">
          Manage FAQs shown on each category landing page.
        </p>
      </div>

      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b border-gray-100 px-4 pt-3">
          {MAIN_PAGE_FAQ_CATEGORIES.map((cat) => {
            const active = cat.key === activeCategory;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-4 py-3 text-[15px] font-semibold transition-colors relative ${
                  active ? 'text-[#1e78ff]' : 'text-gray-500 hover:text-[#1e2a4a]'
                }`}
              >
                {cat.label}
                {active && (
                  <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-full bg-[#1e78ff]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-[20px] font-bold text-[#1e2a4a]">{activeMeta.pageTitle}</h2>
            <p className="mt-1 text-[14px] text-gray-500">{activeMeta.description}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading FAQs...
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <JoditEditor
                key={activeCategory}
                value={draftContent}
                config={editorConfig}
                onBlur={(content) =>
                  setDraftFaqs((prev) => ({ ...prev, [activeCategory]: content }))
                }
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={loading || saving || !isDirty}
              onClick={handleSave}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all disabled:cursor-not-allowed ${
                isDirty && !loading
                  ? 'bg-[#1e78ff] text-white hover:bg-blue-600'
                  : 'bg-gray-200 text-gray-500'
              } disabled:opacity-70`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save {activeMeta.label} FAQs
            </button>
            <button
              type="button"
              disabled={loading || saving || !isDirty}
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#1e78ff] text-[#1e78ff] font-bold hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
