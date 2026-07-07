'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Plus,
  Loader2,
  Send,
  Eye,
  Pencil,
  Copy,
  Trash2,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  deleteEmailTemplate,
  duplicateEmailTemplate,
  fetchEmailTemplates,
  sendEmailTemplate,
} from '@/features/email-templates/slice';
import { EmailTemplate } from '@/redux/types/emailTemplateTypes';
import { formatEmailTemplateDate } from '@/lib/emailTemplateValidation';
import EmailTemplatePreviewModal from '@/components/admin/email-templates/EmailTemplatePreviewModal';
import ActionsDropdown from '@/components/admin/email-templates/ActionsDropdown';
import ConfirmModal from '@/components/common/ConfirmModal';
import toast from 'react-hot-toast';

export default function EmailTemplatesPage() {
  const dispatch = useAppDispatch();
  const { templates, loading, sending } = useAppSelector((state) => state.emailTemplates);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendId, setSendId] = useState<string | null>(null);

  const loadTemplates = useCallback(() => {
    dispatch(fetchEmailTemplates());
  }, [dispatch]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handlePreview = (template: EmailTemplate) => {
    setOpenMenuId(null);
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleDuplicate = async (id: string) => {
    setOpenMenuId(null);
    try {
      await dispatch(duplicateEmailTemplate(id)).unwrap();
      toast.success('Template duplicated successfully');
      loadTemplates();
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to duplicate template');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await dispatch(deleteEmailTemplate(deleteId)).unwrap();
      toast.success('Template deleted successfully');
      loadTemplates();
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete template');
    } finally {
      setDeleteId(null);
    }
  };

  const confirmSend = async () => {
    if (!sendId) return;
    try {
      const result = await dispatch(sendEmailTemplate(sendId)).unwrap();
      toast.success(result.message);
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to send email');
    } finally {
      setSendId(null);
    }
  };

  const thClass =
    'px-6 py-5 text-[13px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between mt-15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1e2a4a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-[#1e2a4a]">Email Templates</h1>
        </div>
        <Link
          href="/admin/email-templates/create"
          className="bg-[#1e2a4a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full min-w-max text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className={thClass}>Template Name</th>
                <th className={thClass}>Subject</th>
                <th className={thClass}>Last Updated</th>
                <th className={thClass}>Created At</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1e2a4a] mx-auto" />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
                    No email templates found. Create your first template to get started.
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-[15px] font-semibold text-[#1e2a4a]">
                      {template.name}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-gray-600 max-w-md truncate">
                      {template.subject}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-gray-500 whitespace-nowrap">
                      {formatEmailTemplateDate(template.updatedAt)}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-gray-500 whitespace-nowrap">
                      {formatEmailTemplateDate(template.createdAt)}
                    </td>
                    <td className="px-6 py-4 relative overflow-visible">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setSendId(template.id)}
                          disabled={sending}
                          className="inline-flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-60 shadow-sm"
                        >
                          <Send className="h-4 w-4" />
                          Send Email
                        </button>

                        <ActionsDropdown
                          menuId={template.id}
                          isOpen={openMenuId === template.id}
                          onToggle={() =>
                            setOpenMenuId((prev) =>
                              prev === template.id ? null : template.id
                            )
                          }
                          onClose={() => setOpenMenuId(null)}
                        >
                          <button
                            type="button"
                            onClick={() => handlePreview(template)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#1e2a4a] hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                            Preview
                          </button>
                          <Link
                            href={`/admin/email-templates/edit/${template.id}`}
                            onClick={() => setOpenMenuId(null)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#1e2a4a] hover:bg-gray-50 transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-gray-500" />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(template.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#1e2a4a] hover:bg-gray-50 transition-colors"
                          >
                            <Copy className="h-4 w-4 text-gray-500" />
                            Duplicate
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setDeleteId(template.id);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </ActionsDropdown>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EmailTemplatePreviewModal
        open={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewTemplate(null);
        }}
        template={previewTemplate}
      />

      <ConfirmModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Email Template"
        message="Are you sure you want to delete this email template? This action cannot be undone."
      />

      <ConfirmModal
        open={!!sendId}
        onCancel={() => setSendId(null)}
        onConfirm={confirmSend}
        title="Send Email to All Users"
        message="This will send this email template to all active subscribed members. Are you sure you want to continue?"
        confirmLabel={sending ? 'Sending...' : 'Send Email'}
        confirmClassName="bg-green-500 text-white hover:bg-green-600 shadow-green-200"
      />
    </div>
  );
}
