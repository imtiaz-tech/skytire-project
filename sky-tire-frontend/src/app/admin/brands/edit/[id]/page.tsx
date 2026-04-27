'use client';

import { useEffect, useState, use } from 'react';
import BrandForm from '@/components/admin/BrandForm';
import api from '@/lib/api';
import { Brand } from '@/redux/types/brandTypes';
import { Loader2 } from 'lucide-react';

export default function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const response = await api.get(`/brands/${id}`);
        setBrand(response.data);
      } catch (err) {
        console.error('Failed to fetch brand:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBrand();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 className="h-10 w-10 text-[#3B5998] animate-spin" />
      <p className="text-gray-400 font-medium">Loading brand details...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {brand ? <BrandForm editBrand={brand} /> : <div>Brand not found</div>}
    </div>
  );
}
