export interface KnockOffChip {
  image?: string;
  name: string;
}

export interface KnockOff {
  image?: string;
  name: string;
  price: number;
  chipOption: string; // "yes" or "no" or "none"
  chips: KnockOffChip[];
}

export interface FloatingCap {
  image?: string;
  name: string;
  price: number;
}

export interface WireWheel {
  id: string;
  images: string[];
  knockOffs: KnockOff | any;
  floatingCaps: FloatingCap | any;
  name: string;
  description: string | null;
  sku: string;
  size: string;
  finish: string | null;
  countryOfOrigin: string | null;
  brandId: string | null;
  sourceId: string | null;
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
  mapPrice: number;
  regularPrice: number;
  shippingCost: number;
  handlingFee: number;
  packageInclude: string | null;
  knockOffOption: string | null;
  options: string | null;
  boltPattern: string | null;
  accessories: string | null;
  backSpacing: number | null;
  spoke: number | null;
  spokeStyle: string | null;
  offset: string | null;
  staggeredFitment?: boolean;
  wireWheelWeight?: string | null;
  shippingDimensions?: string | null;
  keywords: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  
  platingDepthScore: number;
  sealingIntegrityScore: number;
  spokeTensionScore: number;
  feedbackScore: number;
  
  status: string; // draft / published
  isVisible: boolean;
  isActive: boolean;
  slug: string;
  oldSlugs: string[];
  
  brand?: {
    id: string;
    brandName: string;
    brandLogo: string;
  } | null;
  source?: {
    id: string;
    source: string;
  } | null;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface WireWheelsState {
  wireWheels: WireWheel[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
