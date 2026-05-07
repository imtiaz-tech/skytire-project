'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TireModelForm from '@/components/admin/TireModelForm';
import { TireModel } from '@/redux/types/tireModelTypes';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function EditTireModelPage() {
  const { id } = useParams();
  const [model, setModel] = useState<TireModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        const response = await axios.get(`/api/admin/tire-models/${id}`);
        setModel(response.data);
      } catch (error) {
        console.error('Error fetching model:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchModel();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-400">Tire model not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <TireModelForm editModel={model} />
    </div>
  );
}
