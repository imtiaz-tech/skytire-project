import React from 'react';
import AccessoryForm from '@/components/admin/AccessoryForm';

export default function AddAccessoryPage({ searchParams }: { searchParams: { duplicateId?: string } }) {
  return <AccessoryForm duplicateId={searchParams.duplicateId} />;
}
