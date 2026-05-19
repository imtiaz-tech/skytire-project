export interface Wheel {
  id: string;
  sku: string;
  productName: string;
  brandId: string | null;
  brandVariant: string;
  displayStyleNo: string | null;
  finish: string | null;
  slug: string;
  oldSlugs: string[];
  wheelSize: string;
  modelName: string | null;
  style: string | null;
  alternatePartNumber: string | null;
  upcNo: string | null;
  lugCount: number | null;
  boltPatternInches: string | null;
  boltPatternMM: string | null;
  loadRatingInches: string | null;
  loadRatingMM: string | null;
  offset: string;
  backSpacing: number | null;
  centerBore: string | null;
  shippingWeight: string;
  images: string[];
  description: string | null;
  invOrderType: string | null;
  stock: number;
  cost: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  shippingCost: number;
  handlingFee: number;
  isFeatured: boolean;
  keywords: string | null;
  metaDescription: string | null;
  seoTitle: string | null;
  isVisible: boolean;
  category: string;
  status: string;

  brand?: {
    id: string;
    brandName: string;
  };
  sources?: any[]; // Reusing InventorySource structure

  createdAt?: string;
  updatedAt?: string;
}

export interface WheelsState {
  wheels: Wheel[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
