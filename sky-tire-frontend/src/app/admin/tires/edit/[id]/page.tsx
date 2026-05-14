'use client';

import TireSizeForm from '@/components/admin/TireSizeForm';
import { useParams } from 'next/navigation';

export default function EditTirePage() {
  const { id } = useParams();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <TireSizeForm editTireId={id as string} />
    </div>
  );
}
