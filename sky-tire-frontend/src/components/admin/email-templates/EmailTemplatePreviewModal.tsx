'use client';

import React, { useState } from 'react';
import { X, Monitor, Smartphone } from 'lucide-react';
import { EmailTemplate } from '@/redux/types/emailTemplateTypes';

interface EmailTemplatePreviewModalProps {
  open: boolean;
  onClose: () => void;
  template: EmailTemplate | null;
}

export default function EmailTemplatePreviewModal({
  open,
  onClose,
  template,
}: EmailTemplatePreviewModalProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!open || !template) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:pl-[280px]">
      <div className="absolute inset-0 bg-[#1e2a4a]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1e2a4a]">
            Preview: {template.name}
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'desktop'
                  ? 'bg-[#1e2a4a] text-white'
                  : 'bg-white border border-gray-200 text-[#1e2a4a]'
              }`}
            >
              <Monitor className="h-4 w-4" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'mobile'
                  ? 'bg-[#1e2a4a] text-white'
                  : 'bg-white border border-gray-200 text-[#1e2a4a]'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              Mobile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-[#1e2a4a] text-white rounded-lg hover:bg-opacity-90 transition-all ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <div
            className={`mx-auto bg-white shadow-lg transition-all duration-300 ${
              viewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-3xl'
            }`}
          >
            <iframe
              title={`Preview ${template.name}`}
              srcDoc={template.html}
              className="w-full border-0"
              style={{ minHeight: '500px', height: '70vh' }}
            />
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-[#1e2a4a] text-[#1e2a4a] rounded-lg text-sm font-bold hover:bg-gray-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
