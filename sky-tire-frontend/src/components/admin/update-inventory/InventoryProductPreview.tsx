'use client';

import React, { useCallback, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import TirePreviewModal from '@/components/admin/TirePreviewModal';
import WheelPreviewModal from '@/components/admin/WheelPreviewModal';
import WireWheelPreviewModal from '@/components/admin/WireWheelPreviewModal';
import BoltOnWireWheelPreviewModal from '@/components/admin/BoltOnWireWheelPreviewModal';
import AccessoryPreviewModal from '@/components/admin/AccessoryPreviewModal';
import type { Tire } from '@/redux/types/tireTypes';
import type { Wheel } from '@/redux/types/wheelTypes';
import type { WireWheel } from '@/redux/types/wireWheelTypes';
import type { BoltOnWireWheel } from '@/redux/types/boltOnWireWheelTypes';
import type { Accessory } from '@/redux/types/accessoryTypes';

const API_PATH: Record<string, string> = {
  tire: 'tires',
  wheel: 'wheels',
  wireWheel: 'wire-wheels',
  boltOnWheel: 'bolt-on-wire-wheels',
  accessory: 'accessories',
};

/** Above inventory summary / filter modals (z-300 / z-310) */
const PREVIEW_Z = 'z-[320]';

export function useInventoryProductPreview(inventoryType: string | null | undefined) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tire, setTire] = useState<Tire | null>(null);
  const [wheel, setWheel] = useState<Wheel | null>(null);
  const [wireWheel, setWireWheel] = useState<WireWheel | null>(null);
  const [boltOnWireWheel, setBoltOnWireWheel] = useState<BoltOnWireWheel | null>(null);
  const [accessory, setAccessory] = useState<Accessory | null>(null);

  const clear = useCallback(() => {
    setTire(null);
    setWheel(null);
    setWireWheel(null);
    setBoltOnWireWheel(null);
    setAccessory(null);
  }, []);

  const closePreview = useCallback(() => {
    setOpen(false);
    clear();
  }, [clear]);

  const openPreview = useCallback(
    async (productId: string) => {
      const path = inventoryType ? API_PATH[inventoryType] : null;
      if (!path || !productId) {
        toast.error('Unable to open product preview');
        return;
      }

      setLoading(true);
      clear();
      try {
        const res = await axios.get(`/api/admin/${path}/${productId}`);
        const data = res.data;
        if (!data || data.error) {
          throw new Error(data?.error || 'Product not found');
        }

        switch (inventoryType) {
          case 'tire':
            setTire(data as Tire);
            break;
          case 'wheel':
            setWheel(data as Wheel);
            break;
          case 'wireWheel':
            setWireWheel(data as WireWheel);
            break;
          case 'boltOnWheel':
            setBoltOnWireWheel(data as BoltOnWireWheel);
            break;
          case 'accessory':
            setAccessory(data as Accessory);
            break;
          default:
            toast.error('Unsupported inventory type');
            return;
        }
        setOpen(true);
      } catch (err: unknown) {
        const message =
          axios.isAxiosError(err) && err.response?.data?.error
            ? String(err.response.data.error)
            : err instanceof Error
              ? err.message
              : 'Failed to load product';
        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    [inventoryType, clear]
  );

  const previewModals = (
    <>
      {loading && (
        <div className={`fixed inset-0 ${PREVIEW_Z} flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 rounded-xl bg-white px-6 py-4 text-sm font-medium text-gray-700 shadow-xl">
            Loading product…
          </div>
        </div>
      )}
      <TirePreviewModal
        open={open && inventoryType === 'tire'}
        onClose={closePreview}
        tire={tire}
        zClassName={PREVIEW_Z}
      />
      <WheelPreviewModal
        open={open && inventoryType === 'wheel'}
        onClose={closePreview}
        wheel={wheel}
        zClassName={PREVIEW_Z}
      />
      <WireWheelPreviewModal
        open={open && inventoryType === 'wireWheel'}
        onClose={closePreview}
        wireWheel={wireWheel}
        zClassName={PREVIEW_Z}
      />
      <BoltOnWireWheelPreviewModal
        open={open && inventoryType === 'boltOnWheel'}
        onClose={closePreview}
        boltOnWireWheel={boltOnWireWheel}
        zClassName={PREVIEW_Z}
      />
      <AccessoryPreviewModal
        open={open && inventoryType === 'accessory'}
        onClose={closePreview}
        accessory={accessory}
        zClassName={PREVIEW_Z}
      />
    </>
  );

  return { openPreview, previewModals, loading };
}
