'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Mail, Upload, X } from 'lucide-react';
import {
  parseUnlayerDesignJson,
  readFileAsText,
} from '@/lib/emailTemplateImport';

type ImportTab = 'gmail' | 'html-file' | 'json-file';

interface ImportEmailModalProps {
  open: boolean;
  importing: boolean;
  onClose: () => void;
  onImportHtml: (html: string) => void;
  onImportDesign: (design: Record<string, unknown>) => void;
}

export default function ImportEmailModal({
  open,
  importing,
  onClose,
  onImportHtml,
  onImportDesign,
}: ImportEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<ImportTab>('gmail');
  const [pastedHtml, setPastedHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const htmlFileRef = useRef<HTMLInputElement>(null);
  const jsonFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setTab('gmail');
    setPastedHtml('');
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const handlePasteImport = () => {
    setError(null);
    try {
      onImportHtml(pastedHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import HTML');
    }
  };

  const handleHtmlFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const text = await readFileAsText(file);
      onImportHtml(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read HTML file');
    }
  };

  const handleJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const text = await readFileAsText(file);
      const design = parseUnlayerDesignJson(text);
      onImportDesign(design);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read JSON file');
    }
  };

  const tabs: { key: ImportTab; label: string }[] = [
    { key: 'gmail', label: 'From Gmail / others' },
    { key: 'html-file', label: 'Upload HTML' },
    { key: 'json-file', label: 'Unlayer JSON' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[320] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden my-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#1e2a4a]" />
              <h2 className="text-lg font-bold text-[#1e2a4a]">
                Import from Gmail or other places
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  setTab(t.key);
                  setError(null);
                }}
                className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === t.key
                    ? 'border-[#1e2a4a] text-[#1e2a4a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-6 py-5 space-y-4">
            {tab === 'gmail' && (
              <>
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 space-y-2">
                  <p className="font-semibold">Import &amp; auto-convert to editable blocks</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Open the email in Gmail / Yahoo / Outlook.</li>
                    <li>
                      Click ⋮ (More) → <strong>Show original</strong> → select all → Copy
                      (we extract the HTML body and strip headers like Delivered-To / DKIM).
                    </li>
                    <li>Or: right‑click the email body → Inspect → copy the message HTML from the iframe.</li>
                    <li>
                      Paste below and click <strong>Import &amp; convert</strong> — images,
                      headings, text, buttons, columns, and dividers become Unlayer blocks.
                    </li>
                  </ol>
                  <p className="text-xs text-blue-700 pt-1">
                    Complex sections that cannot be mapped safely are kept as HTML blocks
                    so nothing is lost. Existing Unlayer design JSON imports still load as
                    fully editable designs.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">
                    Paste Gmail “Show original” or email HTML
                  </label>
                  <textarea
                    value={pastedHtml}
                    onChange={(e) => setPastedHtml(e.target.value)}
                    rows={10}
                    placeholder="Paste full Show original source, or clean email HTML…"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-mono text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all resize-y min-h-[180px]"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-[#1e2a4a] hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={importing || !pastedHtml.trim()}
                    onClick={handlePasteImport}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e2a4a] text-white text-sm font-bold hover:bg-opacity-90 disabled:opacity-60"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing…
                      </>
                    ) : (
                      'Import & convert'
                    )}
                  </button>
                </div>
              </>
            )}

            {tab === 'html-file' && (
              <>
                <p className="text-sm text-gray-600">
                  Upload an <strong>.html</strong> or <strong>.htm</strong> file exported
                  from an email client or another builder.
                </p>
                <input
                  ref={htmlFileRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  className="hidden"
                  onChange={handleHtmlFile}
                />
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => htmlFileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-gray-300 text-[#1e2a4a] text-sm font-bold hover:bg-gray-50 disabled:opacity-60 w-full justify-center"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Choose HTML file
                </button>
              </>
            )}

            {tab === 'json-file' && (
              <>
                <p className="text-sm text-gray-600">
                  Upload an Unlayer <strong>design JSON</strong> export. This loads as a
                  fully drag-and-drop editable design.
                </p>
                <input
                  ref={jsonFileRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleJsonFile}
                />
                <button
                  type="button"
                  disabled={importing}
                  onClick={() => jsonFileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-gray-300 text-[#1e2a4a] text-sm font-bold hover:bg-gray-50 disabled:opacity-60 w-full justify-center"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Choose Unlayer JSON file
                </button>
              </>
            )}

            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
