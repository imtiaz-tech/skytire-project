import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { ShippingCategory } from '@/redux/types/shippingTypes';
import { lookupShippingBySize, mapShippingToProductFields } from '@/utils/shipping';

type WeightField = 'tireWeight' | 'shippingWeight' | 'wireWheelWeight';

interface UseShippingAutoFillOptions {
  category: ShippingCategory;
  weightField: WeightField;
  onApply: (fields: Record<string, string>) => void;
}

export function useShippingAutoFill({ category, weightField, onApply }: UseShippingAutoFillOptions) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyShippingLookup = useCallback(
    async (size: string) => {
      const trimmed = size.trim();
      if (!trimmed) return;

      const record = await lookupShippingBySize(category, trimmed);
      if (!record) return;

      const mapped = mapShippingToProductFields(record);
      onApply({
        [weightField]: mapped.weight,
        shippingDimensions: mapped.shippingDimensions,
        internalShipping: mapped.internalShipping,
      });
      toast.success('Shipping details auto-filled');
    },
    [category, weightField, onApply],
  );

  const handleSizeBlur = useCallback(
    (size: string) => {
      void applyShippingLookup(size);
    },
    [applyShippingLookup],
  );

  const handleSizeChange = useCallback(
    (size: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        void applyShippingLookup(size);
      }, 600);
    },
    [applyShippingLookup],
  );

  return { handleSizeBlur, handleSizeChange };
}
