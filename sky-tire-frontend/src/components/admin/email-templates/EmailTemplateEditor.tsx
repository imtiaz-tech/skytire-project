'use client';

import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import dynamic from 'next/dynamic';
import type { EditorRef } from 'react-email-editor';

const EmailEditor = dynamic(() => import('react-email-editor'), { ssr: false });

export interface EmailTemplateEditorHandle {
  exportHtml: () => Promise<{ html: string; design: Record<string, unknown> }>;
}

interface EmailTemplateEditorProps {
  designJson?: Record<string, unknown> | null;
  minHeight?: string;
}

const EmailTemplateEditor = forwardRef<EmailTemplateEditorHandle, EmailTemplateEditorProps>(
  function EmailTemplateEditor({ designJson, minHeight = '600px' }, ref) {
    const editorRef = React.useRef<EditorRef>(null);
    const [ready, setReady] = React.useState(false);

    useImperativeHandle(ref, () => ({
      exportHtml: () =>
        new Promise((resolve, reject) => {
          const editor = editorRef.current?.editor;
          if (!editor) {
            reject(new Error('Email editor is not ready yet'));
            return;
          }

          editor.exportHtml((data) => {
            resolve({
              html: data.html,
              design: data.design as Record<string, unknown>,
            });
          });
        }),
    }));

    useEffect(() => {
      if (!ready || !designJson) return;
      const editor = editorRef.current?.editor;
      if (!editor) return;
      editor.loadDesign(designJson);
    }, [ready, designJson]);

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ minHeight }}>
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
