import React from 'react';
import BoltOnWireWheelForm from '@/components/admin/BoltOnWireWheelForm';

export default function AddBoltOnWireWheelPage({ searchParams }: { searchParams: { duplicateId?: string } }) {
  return <BoltOnWireWheelForm duplicateId={searchParams.duplicateId} />;
}
