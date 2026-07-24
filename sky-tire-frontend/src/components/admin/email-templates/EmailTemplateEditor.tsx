'use client';

import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import type { EditorRef } from 'react-email-editor';
import {
  designFromImportedHtml,
  isValidUnlayerDesign,
  summarizeConvertedDesign,
} from '@/lib/emailTemplateImport';
import type { UnlayerDesign } from '@/lib/unlayerDesignTypes';

const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false });

export interface EmailTemplateEditorHandle {
  exportHtml: () => Promise<{ html: string; design: Record<string, unknown> }>;
  /** Load validated Unlayer design JSON via loadDesign */
  importDesign: (design: Record<string, unknown>) => void;
  /**
   * Import Gmail/Yahoo (or any) email HTML:
   * extracts MIME HTML → converts to Unlayer blocks → loadDesign().
   */
  importHtml: (html: string) => { blocks: number; htmlFallbacks: number };
}

interface EmailTemplateEditorProps {
  designJson?: Record<string, unknown> | null;
  minHeight?: string;
}

const EmailTemplateEditor = forwardRef<EmailTemplateEditorHandle, EmailTemplateEditorProps>(
  function EmailTemplateEditor({ designJson, minHeight = '600px' }, ref) {
    const editorRef = React.useRef<EditorRef>(null);
    const [ready, setReady] = React.useState(false);
    const importedDesignRef = React.useRef<Record<string, unknown> | null>(null);

    const getEditor = () => {
      const editor = editorRef.current?.editor;
      if (!editor || !ready) {
        throw new Error('Email editor is not ready yet. Please wait a moment and try again.');
      }
      return editor;
    };

    const loadDesignIntoEditor = (design: Record<string, unknown>) => {
      const editor = getEditor();
      if (!isValidUnlayerDesign(design)) {
        throw new Error('Invalid Unlayer design JSON');
      }
      importedDesignRef.current = design;
      editor.loadDesign(design);
    };

    useImperativeHandle(
      ref,
      () => ({
        exportHtml: () =>
          new Promise((resolve, reject) => {
            try {
              const editor = getEditor();
              editor.exportHtml((data) => {
                resolve({
                  html: data.html,
                  design: data.design as Record<string, unknown>,
                });
              });
            } catch (err) {
              reject(err);
            }
          }),
        importDesign: (design: Record<string, unknown>) => {
          loadDesignIntoEditor(design);
        },
        importHtml: (html: string) => {
          const design = designFromImportedHtml(html);
          loadDesignIntoEditor(design);
          const summary = summarizeConvertedDesign(design as unknown as UnlayerDesign);
          return {
            blocks: summary.blocks,
            htmlFallbacks: summary.htmlFallbacks,
          };
        },
      }),
      // ready gates getEditor; editorRef is stable
      [ready]
    );

    useEffect(() => {
      if (!ready) return;
      const editor = editorRef.current?.editor;
      if (!editor) return;

      // Route Unlayer's "Upload Image" through our own API — without this,
      // Unlayer shows "Offline mode is enabled..." because it has no storage.
      const editorWithCallbacks = editor as unknown as {
        registerCallback: (
          name: string,
          cb: (
            file: { attachments: File[] },
            done: (result: { progress: number; url?: string }) => void
          ) => void
        ) => void;
      };
      editorWithCallbacks.registerCallback('image', async (file, done) => {
        try {
          const attachment = file.attachments?.[0];
          if (!attachment) {
            throw new Error('No image selected');
          }
          done({ progress: 10 });

          const formData = new FormData();
          formData.append('files', attachment, attachment.name);
          const res = await fetch('/api/admin/email-templates/import-assets', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { error?: string } | null;
            throw new Error(body?.error || 'Failed to upload image');
          }
          const data = (await res.json()) as { uploaded?: { url: string }[] };
          const url = data.uploaded?.[0]?.url;
          if (!url) {
            throw new Error('Upload did not return a URL');
          }
          // Unlayer runs in a cross-origin iframe — the URL must be absolute.
          const absoluteUrl = url.startsWith('/') ? `${window.location.origin}${url}` : url;
          done({ progress: 100, url: absoluteUrl });
        } catch (err) {
          console.error('Unlayer image upload failed:', err);
          done({ progress: 100 });
        }
      });

      if (importedDesignRef.current) {
        editor.loadDesign(importedDesignRef.current);
        return;
      }

      if (designJson && isValidUnlayerDesign(designJson)) {
        editor.loadDesign(designJson);
      }
    }, [ready, designJson]);

    return (
      <div
        className="border border-gray-200 rounded-xl overflow-hidden bg-white"
        style={{ minHeight }}
      >
        <EmailEditor
          ref={editorRef}
          onReady={() => setReady(true)}
          minHeight={minHeight}
          options={{
            appearance: { theme: 'light' },
            displayMode: 'email',
          }}
        />
      </div>
    );
  }
);

export default EmailTemplateEditor;
