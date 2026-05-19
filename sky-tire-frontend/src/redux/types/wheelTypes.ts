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
  style: string | null;
  alternatePartNumber: string | null;
  upcNo: string | null;
  lugCount: number | null;
  boltPatternInches: string | null;
  boltPatternMM: string | null;
  loadRatingKg: string | null;
  loadRatingLbs: string | null;
  offset: string;
  backspacing: string | null;
  hubBore: string | null;
  constructionType: string | null;
  weight: string | null;
  images: string[];
  description: string | null;
  features: string[];
  stock: number;
  cost: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  keywords: string | null;
  metaDescription: string | null;
  seoTitle: string | null;
  status: string;

  brand?: {
    id: string;
    brandName: string;
  };
  sources?: any[];

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
