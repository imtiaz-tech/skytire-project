'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/redux/hooks';
import {
  createEmailTemplate,
  updateEmailTemplate,
} from '@/features/email-templates/slice';
import { EmailTemplate } from '@/redux/types/emailTemplateTypes';
import EmailTemplateEditor, {
  EmailTemplateEditorHandle,
} from '@/components/admin/email-templates/EmailTemplateEditor';

interface EmailTemplateFormProps {
  mode: 'create' | 'edit';
  template?: EmailTemplate | null;
}

export default function EmailTemplateForm({ mode, template }: EmailTemplateFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const editorRef = useRef<EmailTemplateEditorHandle>(null);

  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required');
      return;
    }
    if (!subject.trim()) {
      toast.error('Email subject is required');
      return;
    }

    setSaving(true);
    try {
      const exported = await editorRef.current?.exportHtml();
      if (!exported?.html?.trim()) {
        toast.error('Please add content to the email template');
        setSaving(false);
        return;
      }

      const payload = {
        name: name.trim(),
        subject: subject.trim(),
        html: exported.html,
        designJson: exported.design,
      };

      if (mode === 'create') {
        await dispatch(createEmailTemplate(payload)).unwrap();
        toast.success('Email template created successfully');
      } else if (template) {
        await dispatch(updateEmailTemplate({ id: template.id, data: payload })).unwrap();
        toast.success('Email template updated successfully');
      }

      router.push('/admin/email-templates');
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to save email template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <h1 className="text-2xl font-bold text-[#1e2a4a]">
          {mode === 'create' ? 'Create New Template' : 'Edit Template'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/email-templates')}
            className="px-6 py-3 border border-gray-200 text-[#1e2a4a] rounded-xl text-sm font-bold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Template
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">
            Template Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter template name"
            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[15px] font-medium text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-500 mb-2">
            Email Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
            className="w-full px-4 py-3 bg-white border border-gray-100 rounded-xl text-[15px] font-medium text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/5 focus:border-[#1e2a4a] transition-all"
          />
        </div>
      </div>

      <EmailTemplateEditor
        ref={editorRef}
        designJson={template?.designJson}
        minHeight="650px"
      />
    </div>
  );
}
