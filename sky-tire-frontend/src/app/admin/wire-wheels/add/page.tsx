import React from 'react';
import WireWheelForm from '@/components/admin/WireWheelForm';

export default function AddWireWheelPage({ searchParams }: { searchParams: { duplicateId?: string } }) {
  return <WireWheelForm duplicateId={searchParams.duplicateId} />;
}
