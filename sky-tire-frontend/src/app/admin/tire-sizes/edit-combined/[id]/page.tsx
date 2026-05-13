'use client';

import React from 'react';
import TireSizeForm from '@/components/admin/TireSizeForm';
import { useParams } from 'next/navigation';

export default function EditCombinedPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <TireSizeForm editTireId={id} />
    </div>
  );
}
