import { CouponCategoryKey } from '@/constants/couponCategories';

export interface CouponProductSelections {
  tires: string[];
  wheels: string[];
  wire_wheels: string[];
  bolt_on_wire_wheels: string[];
  accessories: string[];
}

export interface TireBrandSelection {
  brandIds: string[];
  modelIds: string[];
  tireIds: string[];
}

export interface ProductBrandSelection {
  brandIds: string[];
  productIds: string[];
}

export interface AccessoryBrandSelection {
  brandIds: string[];
  categories: string[];
}

export interface CouponBrandSelections {
  tires: TireBrandSelection;
  wheels: ProductBrandSelection;
  wire_wheels: ProductBrandSelection;
  bolt_on_wire_wheels: ProductBrandSelection;
  accessories: AccessoryBrandSelection;
}

export type CategoryBrandSelection =
  | TireBrandSelection
  | ProductBrandSelection
  | AccessoryBrandSelection;

export function emptyProductSelections(): CouponProductSelections {
  return {
    tires: [],
    wheels: [],
    wire_wheels: [],
    bolt_on_wire_wheels: [],
    accessories: [],
  };
}

export function emptyBrandSelections(): CouponBrandSelections {
  return {
    tires: { brandIds: [], modelIds: [], tireIds: [] },
    wheels: { brandIds: [], productIds: [] },
    wire_wheels: { brandIds: [], productIds: [] },
    bolt_on_wire_wheels: { brandIds: [], productIds: [] },
    accessories: { brandIds: [], categories: [] },
  };
}

export function flattenProductSelections(selections: CouponProductSelections): string[] {
  return [
    ...selections.tires,
    ...selections.wheels,
    ...selections.wire_wheels,
    ...selections.bolt_on_wire_wheels,
    ...selections.accessories,
  ];
}

export function flattenBrandIds(selections: CouponBrandSelections): string[] {
  const ids = new Set<string>();
  (Object.keys(selections) as CouponCategoryKey[]).forEach((key) => {
    const sel = selections[key];
    if ('brandIds' in sel) {
      sel.brandIds.forEach((id) => ids.add(id));
    }
  });
  return Array.from(ids);
}

export function countProductSelections(selections: CouponProductSelections): number {
  return flattenProductSelections(selections).length;
}

export function hasBrandSelections(selections: CouponBrandSelections): boolean {
  return (
    selections.tires.tireIds.length > 0 ||
    selections.wheels.productIds.length > 0 ||
    selections.wire_wheels.productIds.length > 0 ||
    selections.bolt_on_wire_wheels.productIds.length > 0 ||
    selections.accessories.categories.length > 0
  );
}

export function parseProductSelections(value: unknown): CouponProductSelections {
  const defaults = emptyProductSelections();
  if (!value || typeof value !== 'object') return defaults;
  const obj = value as Partial<CouponProductSelections>;
  return {
    tires: Array.isArray(obj.tires) ? obj.tires.map(String) : defaults.tires,
    wheels: Array.isArray(obj.wheels) ? obj.wheels.map(String) : defaults.wheels,
    wire_wheels: Array.isArray(obj.wire_wheels) ? obj.wire_wheels.map(String) : defaults.wire_wheels,
    bolt_on_wire_wheels: Array.isArray(obj.bolt_on_wire_wheels)
      ? obj.bolt_on_wire_wheels.map(String)
      : defaults.bolt_on_wire_wheels,
    accessories: Array.isArray(obj.accessories) ? obj.accessories.map(String) : defaults.accessories,
  };
}

export function parseBrandSelections(value: unknown): CouponBrandSelections {
  const defaults = emptyBrandSelections();
  if (!value || typeof value !== 'object') return defaults;
  const obj = value as Partial<CouponBrandSelections>;

  return {
    tires: {
      brandIds: Array.isArray(obj.tires?.brandIds) ? obj.tires!.brandIds.map(String) : [],
      modelIds: Array.isArray(obj.tires?.modelIds) ? obj.tires!.modelIds.map(String) : [],
      tireIds: Array.isArray(obj.tires?.tireIds) ? obj.tires!.tireIds.map(String) : [],
    },
    wheels: {
      brandIds: Array.isArray(obj.wheels?.brandIds) ? obj.wheels!.brandIds.map(String) : [],
      productIds: Array.isArray(obj.wheels?.productIds) ? obj.wheels!.productIds.map(String) : [],
    },
    wire_wheels: {
      brandIds: Array.isArray(obj.wire_wheels?.brandIds) ? obj.wire_wheels!.brandIds.map(String) : [],
      productIds: Array.isArray(obj.wire_wheels?.productIds)
        ? obj.wire_wheels!.productIds.map(String)
        : [],
    },
    bolt_on_wire_wheels: {
      brandIds: Array.isArray(obj.bolt_on_wire_wheels?.brandIds)
        ? obj.bolt_on_wire_wheels!.brandIds.map(String)
        : [],
      productIds: Array.isArray(obj.bolt_on_wire_wheels?.productIds)
        ? obj.bolt_on_wire_wheels!.productIds.map(String)
        : [],
    },
    accessories: {
      brandIds: Array.isArray(obj.accessories?.brandIds) ? obj.accessories!.brandIds.map(String) : [],
      categories: Array.isArray(obj.accessories?.categories)
        ? obj.accessories!.categories.map(String)
        : [],
    },
  };
}

export function legacyProductSelections(productIds: string[]): CouponProductSelections {
  return { ...emptyProductSelections(), tires: [...productIds] };
}

export function legacyBrandSelections(brandIds: string[]): CouponBrandSelections {
  return {
    ...emptyBrandSelections(),
    tires: { brandIds: [...brandIds], modelIds: [], tireIds: [] },
  };
}
