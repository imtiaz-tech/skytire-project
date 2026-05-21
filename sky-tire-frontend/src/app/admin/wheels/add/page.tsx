import React from 'react';
import WheelForm from '@/components/admin/WheelForm';

export default function AddWheelPage({ searchParams }: { searchParams: { duplicateId?: string } }) {
  return <WheelForm duplicateId={searchParams.duplicateId} />;
}
