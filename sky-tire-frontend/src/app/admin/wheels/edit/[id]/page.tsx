import React from 'react';
import WheelForm from '@/components/admin/WheelForm';

export default async function EditWheelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WheelForm editWheelId={id} />;
}
