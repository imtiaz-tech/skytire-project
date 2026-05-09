'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TireSizeForm from '@/components/admin/TireSizeForm';
import { TireSize } from '@/redux/types/tireSizeTypes';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function EditTireSizePage() {
  const { id } = useParams();
  const [size, setSize] = useState<TireSize | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSize = async () => {
      try {
        const response = await axios.get(`/api/admin/tire-sizes/${id}`);
        setSize(response.data);
      } catch (error) {
        console.error('Error fetching size:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSize();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
      </div>
    );
  }

  if (!size) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-400">Tire size not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <TireSizeForm editSize={size} />
    </div>
  );
}
