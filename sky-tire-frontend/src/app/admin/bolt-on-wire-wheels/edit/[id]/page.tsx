import React from 'react';
import BoltOnWireWheelForm from '@/components/admin/BoltOnWireWheelForm';

export default async function EditBoltOnWireWheelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BoltOnWireWheelForm editBoltOnWireWheelId={id} />;
}
