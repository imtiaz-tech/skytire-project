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
  backSpacing: number | string | null;
  hubBore: string | null;
  constructionType: string | null;
  shippingWeight: string | null;
  shippingDimensions?: string | null;
  images: string[];
  /** Uploaded product video filename/path (served from /uploads). */
  video?: string | null;
  /** Optional YouTube watch/share URL. */
  youtubeUrl?: string | null;
  description: string | null;
  features: string[];
  stock: number;
  cost: number;
  internalShipping?: number;
  processingCharges?: number;
  margin?: number;
  processingAmount?: number;
  marginAmount?: number;
  netCost?: number;
  minimumSalePrice?: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  shippingCost?: number;
  handlingFee?: number;
  keywords: string | null;
  metaDescription: string | null;
  seoTitle: string | null;
  faqs?: string | null;
  tags?: string[];
  alsoFoundIn?: string[];
  status: string;
  
  finishDurabilityScore?: number | null;
  fitmentPrecisionScore?: number | null;
  impactResistanceScore?: number | null;
  feedbackScore?: number | null;
  isActive?: boolean;
  isVisible?: boolean;
  isFeatured?: boolean;

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
