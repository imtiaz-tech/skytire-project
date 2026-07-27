export interface AccessorySpecifications {
  brand?: string;
  boltPattern?: string;
  innerBoltPattern?: string;
  outerBoltPattern?: string;
  thickness?: string;
  lugCount?: string;
  holeDesign?: string;
  fitmentType?: string;
  material?: string;
  construction?: string;
  finish?: string;
  colorCoding?: string;
  sideOrientation?: string;
  vehicleCompatibility?: string;
  wireWheelBrandsCompatibility?: string;
  warranty?: string;
  weight?: string;
  shippingDimensions?: string;
  partNumber?: string;
  qty?: string;
  [key: string]: string | undefined;
}

export interface Accessory {
  id: string;
  sku: string;
  alternatePartNumber?: string | null;
  upcNo?: string | null;
  category: string;
  productName: string;
  status: string;
  slug: string;
  oldSlugs: string[];
  packageInclude: string | null;
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
  mapPriceHistory?: { value: number; createdAt: string }[] | null;
  regularPrice: number | null;
  shippingCost: number;
  handlingFee: number;
  priceChanged: number;
  brandId: string | null;
  sourceId: string | null;
  stock: number;
  images: string[];
  /** Uploaded product video filename/path (served from /uploads). */
  video?: string | null;
  /** Optional YouTube watch/share URL. */
  youtubeUrl?: string | null;
  leftImage: string | null;
  rightImage: string | null;
  isFeatured: boolean;
  isVisible: boolean;
  description: string | null;
  keywords: string | null;
  metaDescription: string | null;
  seoTitle: string | null;
  specifications: AccessorySpecifications | null;
  materialHardnessScore: number | null;
  threadPrecisionScore: number | null;
  torqueRetentionScore: number | null;
  feedbackScore: number | null;
  overallRating: number;
  brand?: {
    id: string;
    brandName: string;
    brandLogo?: string;
  } | null;
  source?: {
    id: string;
    source: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccessoriesState {
  accessories: Accessory[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
