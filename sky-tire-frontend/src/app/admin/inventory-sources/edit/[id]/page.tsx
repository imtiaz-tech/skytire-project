'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import InventorySourceForm from '@/components/admin/InventorySourceForm';
import { InventorySource } from '@/redux/types/inventorySourceTypes';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

export default function EditInventorySourcePage() {
  const { id } = useParams();
  const [source, setSource] = useState<InventorySource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSource = async () => {
      try {
        const response = await axios.get(`/api/admin/inventory-sources/${id}`);
        setSource(response.data);
      } catch (error) {
        console.error('Error fetching inventory source:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSource();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-[#1e2a4a] animate-spin" />
      </div>
    );
  }

  if (!source) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-gray-400">Inventory source not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <InventorySourceForm editSource={source} />
    </div>
  );
}
