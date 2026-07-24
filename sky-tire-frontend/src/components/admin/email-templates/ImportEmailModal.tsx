'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, Mail, Upload, X } from 'lucide-react';
import { resolveEmailImportFiles } from '@/lib/resolveEmailImportPackage';

type ImportTab = 'gmail' | 'html-file' | 'unlayer-export';

interface ImportEmailModalProps {
  open: boolean;
  importing: boolean;
  onClose: () => void;
  onImportHtml: (html: string, meta?: { message?: string }) => void;
  onImportDesign: (design: Record<string, unknown>, meta?: { message?: string }) => void;
  onImportStart?: () => void;
  onImportEnd?: () => void;
}

export default function ImportEmailModal({
  open,
  importing,
  onClose,
  onImportHtml,
  onImportDesign,
  onImportStart,
  onImportEnd,
}: ImportEmailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<ImportTab>('gmail');
  const [pastedHtml, setPastedHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const htmlFileRef = useRef<HTMLInputElement>(null);
  const unlayerFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPastedHtml('');
    setError(null);
    setBusy(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const isBusy = importing || busy;

  const handlePasteImport = () => {
    setError(null);
    try {
      onImportHtml(pastedHtml);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import HTML');
    }
  };

  const handlePackageFiles = async (files: File[]) => {
    if (files.length === 0) {
      setError('No file selected. Please choose a ZIP, HTML, or JSON file.');
      return;
    }
    setError(null);
    setBusy(true);
    onImportStart?.();
    try {
      const resolved = await resolveEmailImportFiles(files);
      if (resolved.kind === 'design') {
        onImportDesign(resolved.design, { message: resolved.message });
      } else {
        onImportHtml(resolved.html, { message: resolved.message });
      }
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? // axios-style
            ((err as { response?: { data?: { error?: string } }; message?: string })
              .response?.data?.error ||
              (err as { message?: string }).message ||
              'Failed to import file')
          : err instanceof Error
            ? err.message
            : 'Failed to import file';
      setError(message);
    } finally {
      setBusy(false);
      onImportEnd?.();
    }
  };

  /** Snapshot FileList before clearing the input — FileList is live and becomes empty after reset. */
  const onFileInputChange = (input: HTMLInputElement) => {
    const files = Array.from(input.files || []);
    input.value = '';
    void handlePackageFiles(files);
  };

  const tabs: { key: ImportTab; label: string }[] = [
    { key: 'gmail', label: 'From Gmail / others' },
    { key: 'html-file', label: 'Upload HTML / ZIP' },
    { key: 'unlayer-export', label: 'Unlayer export' },
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
                      (we extract the HTML body and strip headers).
                    </li>
                    <li>
                      Paste below and click <strong>Import &amp; convert</strong>.
                    </li>
                  </ol>
                  <p className="text-xs text-blue-700 pt-1">
                    Gmail images usually use absolute URLs and display correctly. For Unlayer
                    downloads with an <strong>images</strong> folder, use the{' '}
                    <strong>Upload HTML / ZIP</strong> or <strong>Unlayer export</strong> tab
                    and upload the ZIP so images are included.
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
                    disabled={isBusy || !pastedHtml.trim()}
                    onClick={handlePasteImport}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1e2a4a] text-white text-sm font-bold hover:bg-opacity-90 disabled:opacity-60"
                  >
                    {isBusy ? (
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
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 space-y-2">
                  <p className="font-semibold">HTML file or ZIP package</p>
                  <p>
                    If you downloaded a template from Unlayer / Gmail as a folder with{' '}
                    <code className="text-xs bg-white/70 px-1 rounded">index.html</code> +{' '}
                    <code className="text-xs bg-white/70 px-1 rounded">images/</code>, zip that
                    folder and upload the <strong>.zip</strong> here so images display.
                  </p>
                  <p className="text-xs text-blue-700">
                    Uploading only <code className="text-xs">index.html</code> without images
                    causes broken image icons (relative paths like{' '}
                    <code className="text-xs">images/image-1.png</code>).
                  </p>
                </div>
                <input
                  ref={htmlFileRef}
                  type="file"
                  multiple
                  accept=".html,.htm,.zip,.png,.jpg,.jpeg,.gif,.webp,text/html,application/zip,image/*"
                  className="hidden"
                  onChange={(e) => onFileInputChange(e.target)}
                />
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => htmlFileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-gray-300 text-[#1e2a4a] text-sm font-bold hover:bg-gray-50 disabled:opacity-60 w-full justify-center"
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Choose HTML, images, or ZIP
                </button>
              </>
            )}

            {tab === 'unlayer-export' && (
              <>
                <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900 space-y-2">
                  <p className="font-semibold">Unlayer studio export</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>
                      From{' '}
                      <a
                        href="https://studio.unlayer.com"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold"
                      >
                        studio.unlayer.com
                      </a>
                      , export <strong>HTML</strong> (ZIP with images) or{' '}
                      <strong>JSON</strong> design.
                    </li>
                    <li>
                      If Gmail gives you a folder with{' '}
                      <code className="text-xs bg-white/70 px-1 rounded">index.html</code> and{' '}
                      <code className="text-xs bg-white/70 px-1 rounded">images</code>, compress
                      that folder to a <strong>.zip</strong> and upload it here.
                    </li>
                    <li>
                      Pure <strong>.json</strong> design exports are also accepted (fully
                      drag-and-drop editable).
                    </li>
                  </ol>
                </div>
                <input
                  ref={unlayerFileRef}
                  type="file"
                  multiple
                  accept=".json,.zip,.html,.htm,.png,.jpg,.jpeg,.gif,.webp,application/json,application/zip,text/html,image/*"
                  className="hidden"
                  onChange={(e) => onFileInputChange(e.target)}
                />
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => unlayerFileRef.current?.click()}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-dashed border-gray-300 text-[#1e2a4a] text-sm font-bold hover:bg-gray-50 disabled:opacity-60 w-full justify-center"
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Choose Unlayer ZIP / JSON / HTML (+ images)
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
