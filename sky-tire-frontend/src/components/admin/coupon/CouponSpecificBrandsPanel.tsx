'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import CouponCategoryTabs from './CouponCategoryTabs';
import { DEFAULT_COUPON_CATEGORY, CouponCategoryKey } from '@/constants/couponCategories';
import { CouponBrandSelections } from '@/types/couponSelections';

interface LookupItem {
  id: string;
  label: string;
}

interface CouponSpecificBrandsPanelProps {
  selections: CouponBrandSelections;
  onChange: (selections: CouponBrandSelections) => void;
  error?: string;
  onClearError?: () => void;
}

const inputClass =
  'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-[#1e2a4a] focus:ring-2 focus:ring-[#1e2a4a]/10 focus:border-[#1e2a4a] transition-all';
const sectionClass = 'space-y-2';
const sectionTitleClass = 'text-xs font-bold text-gray-400 uppercase tracking-wider';

function CheckboxList({
  items,
  selected,
  onToggle,
  loading,
  emptyText,
}: {
  items: LookupItem[];
  selected: string[];
  onToggle: (id: string) => void;
  loading: boolean;
  emptyText: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-[#1e2a4a]" />
      </div>
    );
  }
  if (items.length === 0) {
    return <p className="text-sm text-gray-400 p-2">{emptyText}</p>;
  }
  return (
    <div className="max-h-40 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm"
        >
          <input
            type="checkbox"
            checked={selected.includes(item.id)}
            onChange={() => onToggle(item.id)}
            className="w-4 h-4 rounded border-gray-300 text-[#1e2a4a]"
          />
          <span>{item.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function CouponSpecificBrandsPanel({
  selections,
  onChange,
  error,
  onClearError,
}: CouponSpecificBrandsPanelProps) {
  const [activeTab, setActiveTab] = useState<CouponCategoryKey>(DEFAULT_COUPON_CATEGORY);
  const [brandSearch, setBrandSearch] = useState('');
  const [sizeSearch, setSizeSearch] = useState('');
  const [brands, setBrands] = useState<LookupItem[]>([]);
  const [models, setModels] = useState<LookupItem[]>([]);
  const [sizes, setSizes] = useState<LookupItem[]>([]);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingSizes, setLoadingSizes] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const tireSel = selections.tires;
  const wheelSel = selections.wheels;
  const wireSel = selections.wire_wheels;
  const boltSel = selections.bolt_on_wire_wheels;
  const accessorySel = selections.accessories;

  const activeBrandIds =
    activeTab === 'tires'
      ? tireSel.brandIds
      : activeTab === 'wheels'
        ? wheelSel.brandIds
        : activeTab === 'wire_wheels'
          ? wireSel.brandIds
          : activeTab === 'bolt_on_wire_wheels'
            ? boltSel.brandIds
            : accessorySel.brandIds;

  useEffect(() => {
    const fetchBrands = async () => {
      setLoadingBrands(true);
      try {
        const res = await axios.get(
          `/api/admin/coupons/targets?step=brands&category=${activeTab}&search=${encodeURIComponent(brandSearch)}`
        );
        setBrands(res.data);
      } catch {
        toast.error('Failed to load brands');
      } finally {
        setLoadingBrands(false);
      }
    };
    fetchBrands();
  }, [activeTab, brandSearch]);

  useEffect(() => {
    if (activeTab !== 'tires' || tireSel.brandIds.length === 0) {
      setModels([]);
      return;
    }
    const fetchModels = async () => {
      setLoadingModels(true);
      try {
        const res = await axios.get(
          `/api/admin/coupons/targets?step=tire-models&brandIds=${tireSel.brandIds.join(',')}`
        );
        setModels(res.data);
      } catch {
        toast.error('Failed to load tire models');
      } finally {
        setLoadingModels(false);
      }
    };
    fetchModels();
  }, [activeTab, tireSel.brandIds]);

  useEffect(() => {
    if (activeTab === 'tires') {
      if (tireSel.brandIds.length === 0 || tireSel.modelIds.length === 0) {
        setSizes([]);
        return;
      }
      const fetchSizes = async () => {
        setLoadingSizes(true);
        try {
          const res = await axios.get(
            `/api/admin/coupons/targets?step=tire-sizes&brandIds=${tireSel.brandIds.join(',')}&modelIds=${tireSel.modelIds.join(',')}&search=${encodeURIComponent(sizeSearch)}`
          );
          setSizes(res.data);
        } catch {
          toast.error('Failed to load tire sizes');
        } finally {
          setLoadingSizes(false);
        }
      };
      fetchSizes();
      return;
    }

    if (activeTab === 'wheels') {
      if (wheelSel.brandIds.length === 0) {
        setSizes([]);
        return;
      }
      const fetchSizes = async () => {
        setLoadingSizes(true);
        try {
          const res = await axios.get(
            `/api/admin/coupons/targets?step=wheel-products&brandIds=${wheelSel.brandIds.join(',')}&search=${encodeURIComponent(sizeSearch)}`
          );
          setSizes(res.data);
        } catch {
          toast.error('Failed to load wheel sizes');
        } finally {
          setLoadingSizes(false);
        }
      };
      fetchSizes();
      return;
    }

    if (activeTab === 'wire_wheels') {
      if (wireSel.brandIds.length === 0) {
        setSizes([]);
        return;
      }
      const fetchSizes = async () => {
        setLoadingSizes(true);
        try {
          const res = await axios.get(
            `/api/admin/coupons/targets?step=wire-wheel-products&brandIds=${wireSel.brandIds.join(',')}&search=${encodeURIComponent(sizeSearch)}`
          );
          setSizes(res.data);
        } catch {
          toast.error('Failed to load wire wheel sizes');
        } finally {
          setLoadingSizes(false);
        }
      };
      fetchSizes();
      return;
    }

    if (activeTab === 'bolt_on_wire_wheels') {
      if (boltSel.brandIds.length === 0) {
        setSizes([]);
        return;
      }
      const fetchSizes = async () => {
        setLoadingSizes(true);
        try {
          const res = await axios.get(
            `/api/admin/coupons/targets?step=bolt-on-wire-wheel-products&brandIds=${boltSel.brandIds.join(',')}&search=${encodeURIComponent(sizeSearch)}`
          );
          setSizes(res.data);
        } catch {
          toast.error('Failed to load bolt-on wire wheel sizes');
        } finally {
          setLoadingSizes(false);
        }
      };
      fetchSizes();
    }
  }, [
    activeTab,
    tireSel.brandIds,
    tireSel.modelIds,
    wheelSel.brandIds,
    wireSel.brandIds,
    boltSel.brandIds,
    sizeSearch,
  ]);

  useEffect(() => {
    if (activeTab !== 'accessories' || accessorySel.brandIds.length === 0) {
      setCategories([]);
      return;
    }
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const res = await axios.get(
          `/api/admin/coupons/targets?step=accessory-categories&brandIds=${accessorySel.brandIds.join(',')}&search=${encodeURIComponent(sizeSearch)}`
        );
        setCategories(res.data);
      } catch {
        toast.error('Failed to load accessory categories');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [activeTab, accessorySel.brandIds, sizeSearch]);

  const updateTires = (patch: Partial<typeof tireSel>) => {
    onClearError?.();
    onChange({ ...selections, tires: { ...tireSel, ...patch } });
  };

  const updateProductBrand = (
    key: 'wheels' | 'wire_wheels' | 'bolt_on_wire_wheels',
    patch: Partial<{ brandIds: string[]; productIds: string[] }>
  ) => {
    onClearError?.();
    onChange({ ...selections, [key]: { ...selections[key], ...patch } });
  };

  const updateAccessories = (patch: Partial<typeof accessorySel>) => {
    onClearError?.();
    onChange({ ...selections, accessories: { ...accessorySel, ...patch } });
  };

  const toggleBrand = (id: string) => {
    onClearError?.();
    if (activeTab === 'tires') {
      const nextBrands = tireSel.brandIds.includes(id)
        ? tireSel.brandIds.filter((v) => v !== id)
        : [...tireSel.brandIds, id];
      updateTires({
        brandIds: nextBrands,
        modelIds: [],
        tireIds: [],
      });
    } else if (activeTab === 'wheels') {
      const nextBrands = wheelSel.brandIds.includes(id)
        ? wheelSel.brandIds.filter((v) => v !== id)
        : [...wheelSel.brandIds, id];
      updateProductBrand('wheels', { brandIds: nextBrands, productIds: [] });
    } else if (activeTab === 'wire_wheels') {
      const nextBrands = wireSel.brandIds.includes(id)
        ? wireSel.brandIds.filter((v) => v !== id)
        : [...wireSel.brandIds, id];
      updateProductBrand('wire_wheels', { brandIds: nextBrands, productIds: [] });
    } else if (activeTab === 'bolt_on_wire_wheels') {
      const nextBrands = boltSel.brandIds.includes(id)
        ? boltSel.brandIds.filter((v) => v !== id)
        : [...boltSel.brandIds, id];
      updateProductBrand('bolt_on_wire_wheels', { brandIds: nextBrands, productIds: [] });
    } else {
      const nextBrands = accessorySel.brandIds.includes(id)
        ? accessorySel.brandIds.filter((v) => v !== id)
        : [...accessorySel.brandIds, id];
      updateAccessories({ brandIds: nextBrands, categories: [] });
    }
  };

  const toggleModel = (id: string) => {
    const next = tireSel.modelIds.includes(id)
      ? tireSel.modelIds.filter((v) => v !== id)
      : [...tireSel.modelIds, id];
    updateTires({ modelIds: next, tireIds: [] });
  };

  const toggleTireSize = (id: string) => {
    const next = tireSel.tireIds.includes(id)
      ? tireSel.tireIds.filter((v) => v !== id)
      : [...tireSel.tireIds, id];
    updateTires({ tireIds: next });
  };

  const toggleProductSize = (key: 'wheels' | 'wire_wheels' | 'bolt_on_wire_wheels', id: string) => {
    const sel = selections[key];
    const next = sel.productIds.includes(id)
      ? sel.productIds.filter((v) => v !== id)
      : [...sel.productIds, id];
    updateProductBrand(key, { productIds: next });
  };

  const toggleCategory = (id: string) => {
    const next = accessorySel.categories.includes(id)
      ? accessorySel.categories.filter((v) => v !== id)
      : [...accessorySel.categories, id];
    updateAccessories({ categories: next });
  };

  const sizeLabel =
    activeTab === 'accessories'
      ? 'Accessory Categories'
      : activeTab === 'tires'
        ? 'Sizes'
        : 'Sizes';

  return (
    <div
      className={`border rounded-xl p-4 space-y-4 bg-white${
        error ? ' border-red-400' : ' border-gray-200'
      }`}
    >
      <label className="text-sm font-semibold text-gray-500">Select Brands</label>

      <CouponCategoryTabs
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setBrandSearch('');
          setSizeSearch('');
        }}
      />

      <div className={sectionClass}>
        <p className={sectionTitleClass}>1. Select Brand(s)</p>
        <input
          type="text"
          placeholder="Search brands..."
          className={inputClass}
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
        />
        <CheckboxList
          items={brands}
          selected={activeBrandIds}
          onToggle={toggleBrand}
          loading={loadingBrands}
          emptyText="No brands found"
        />
      </div>

      {activeTab === 'tires' && tireSel.brandIds.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>2. Select Tire Model(s)</p>
          <CheckboxList
            items={models}
            selected={tireSel.modelIds}
            onToggle={toggleModel}
            loading={loadingModels}
            emptyText="No models found for selected brands"
          />
        </div>
      )}

      {activeTab === 'tires' && tireSel.modelIds.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>3. Select {sizeLabel}</p>
          <input
            type="text"
            placeholder="Search sizes..."
            className={inputClass}
            value={sizeSearch}
            onChange={(e) => setSizeSearch(e.target.value)}
          />
          <CheckboxList
            items={sizes}
            selected={tireSel.tireIds}
            onToggle={toggleTireSize}
            loading={loadingSizes}
            emptyText="No sizes found for selected models"
          />
        </div>
      )}

      {activeTab === 'wheels' && wheelSel.brandIds.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>2. Select {sizeLabel}</p>
          <input
            type="text"
            placeholder="Search sizes..."
            className={inputClass}
            value={sizeSearch}
            onChange={(e) => setSizeSearch(e.target.value)}
          />
          <CheckboxList
            items={sizes}
            selected={wheelSel.productIds}
            onToggle={(id) => toggleProductSize('wheels', id)}
            loading={loadingSizes}
            emptyText="No wheel sizes found for selected brands"
          />
        </div>
      )}

      {activeTab === 'wire_wheels' && wireSel.brandIds.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>2. Select {sizeLabel}</p>
          <input
            type="text"
            placeholder="Search sizes..."
            className={inputClass}
            value={sizeSearch}
            onChange={(e) => setSizeSearch(e.target.value)}
          />
          <CheckboxList
            items={sizes}
            selected={wireSel.productIds}
            onToggle={(id) => toggleProductSize('wire_wheels', id)}
            loading={loadingSizes}
            emptyText="No wire wheel sizes found for selected brands"
          />
        </div>
      )}

      {activeTab === 'bolt_on_wire_wheels' && boltSel.brandIds.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>2. Select {sizeLabel}</p>
          <input
            type="text"
            placeholder="Search sizes..."
            className={inputClass}
            value={sizeSearch}
            onChange={(e) => setSizeSearch(e.target.value)}
          />
          <CheckboxList
            items={sizes}
            selected={boltSel.productIds}
            onToggle={(id) => toggleProductSize('bolt_on_wire_wheels', id)}
            loading={loadingSizes}
            emptyText="No bolt-on wire wheel sizes found for selected brands"
          />
        </div>
      )}

      {activeTab === 'accessories' && accessorySel.brandIds.length > 0 && (
        <div className={sectionClass}>
          <p className={sectionTitleClass}>2. Select Accessory Categories</p>
          <input
            type="text"
            placeholder="Search categories..."
            className={inputClass}
            value={sizeSearch}
            onChange={(e) => setSizeSearch(e.target.value)}
          />
          <CheckboxList
            items={categories}
            selected={accessorySel.categories}
            onToggle={toggleCategory}
            loading={loadingCategories}
            emptyText="No categories found for selected brands"
          />
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
