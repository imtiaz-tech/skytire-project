'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  fetchEmailTemplateById,
  clearSelectedTemplate,
} from '@/features/email-templates/slice';
import EmailTemplateForm from '@/components/admin/email-templates/EmailTemplateForm';

export default function EditEmailTemplatePage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useAppDispatch();
  const { selectedTemplate, loading } = useAppSelector((state) => state.emailTemplates);

  useEffect(() => {
    if (id) {
      dispatch(fetchEmailTemplateById(id));
    }
    return () => {
      dispatch(clearSelectedTemplate());
    };
  }, [dispatch, id]);

  if (loading || !selectedTemplate) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e2a4a]" />
      </div>
    );
  }

  return <EmailTemplateForm mode="edit" template={selectedTemplate} />;
}
