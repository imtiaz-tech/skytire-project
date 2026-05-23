import React from 'react';
import WireWheelForm from '@/components/admin/WireWheelForm';

export default async function EditWireWheelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WireWheelForm editWireWheelId={id} />;
}
