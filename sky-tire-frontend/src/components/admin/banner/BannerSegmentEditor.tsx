'use client';

import React from 'react';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { BannerSegment } from '@/lib/bannerValidation';

interface BannerSegmentEditorProps {
  title: string;
  segments: BannerSegment[];
  onChange: (segments: BannerSegment[]) => void;
}

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-md text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all outline-none';

export default function BannerSegmentEditor({
  title,
  segments,
  onChange,
}: BannerSegmentEditorProps) {
  const updateSegment = (index: number, patch: Partial<BannerSegment>) => {
    onChange(segments.map((seg, i) => (i === index ? { ...seg, ...patch } : seg)));
  };

  const removeSegment = (index: number) => {
    if (segments.length <= 1) return;
    onChange(segments.filter((_, i) => i !== index));
  };

  const addSegment = () => {
    onChange([...segments, { text: '', color: '#ffffff' }]);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-[#1e2a4a]">{title}</h3>
      {segments.map((segment, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl bg-gray-50/50"
        >
          <button
            type="button"
            className="mt-3 cursor-grab text-gray-300 hover:text-gray-500"
            aria-label="Drag handle"
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Text</label>
              <input
                type="text"
                className={inputClass}
                value={segment.text}
                onChange={(e) => updateSegment(index, { text: e.target.value })}
                placeholder="Segment text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={segment.color.startsWith('#') ? segment.color : '#ffffff'}
                  onChange={(e) => updateSegment(index, { color: e.target.value })}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  className={inputClass}
                  value={segment.color}
                  onChange={(e) => updateSegment(index, { color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeSegment(index)}
            disabled={segments.length <= 1}
            className="mt-2 p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
            aria-label="Remove segment"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addSegment}
        className="inline-flex items-center gap-2 px-4 py-2 border border-[#1e2a4a] text-[#1e2a4a] rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add Segment
      </button>
    </div>
  );
}
