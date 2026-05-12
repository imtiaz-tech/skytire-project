'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TireForm from '@/components/admin/TireForm';
import { Tire } from '@/redux/types/tireTypes';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function EditTirePage() {
  const { id } = useParams();
  const [tire, setTire] = useState<Tire | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTire = async () => {
      try {
        const response = await axios.get(`/api/admin/tires/${id}`);
        setTire(response.data);
      } catch (error) {
        console.error('Error fetching tire:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTire();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
        <p className="text-gray-400 text-sm font-medium">Loading tire details...</p>
      </div>
    );
  }

  if (!tire) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-bold">Tire not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <TireForm editTire={tire} />
    </div>
  );
}
