export interface InventorySource {
  id: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tire {
  id: string;
  modelId: string;
  tireSizeId?: string;
  sku: string;
  alternatePartNumber?: string;
  upcNo?: string;
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
  shippingCost: number;
  handlingFee: number;
  freightCharges: number;
  /** Uploaded product video filename/path (served from /uploads). */
  video?: string | null;
  /** Optional YouTube watch/share URL. */
  youtubeUrl?: string | null;
  rebateAvailable: boolean;
  mileageScore: number;
  tractionScore: number;
  stabilityScore: number;
  feedbackScore: number;
  
  // Fields moved from TireSize
  tireSize: string;
  tireWidth?: string;
  aspectRatio?: string;
  rimDiameter?: string;
  loadIndex?: string;
  speedRating?: string;
  loadRange?: string;
  inflationPressure?: string;
  tireWeight?: string;
  shippingDimensions?: string;
  utqg?: string;
  seoTitle?: string;
  metaDescription?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  vehicleType?: 'PASSENGER' | 'LIGHT_TRUCK' | 'SUV' | 'TRUCK' | 'COMMERCIAL' | 'PERFORMANCE' | 'OFF_ROAD';
  keywords?: string;
  features?: string[];
  /** Rich HTML FAQ content from the admin Jodit editor. */
  faqs?: string | null;
  tags?: string[];
  alsoFoundIn?: string[];
  sidewallCategory?: 'BLACK_WALL' | 'WHITE_WALL';
  sidewallDetail?: string;
  publishStatus?: 'PUBLISHED' | 'DRAFT';
  isActive?: boolean;

  model?: any; // Will be properly typed if needed
  sources?: InventorySource[];
  mapPriceHistory?: { value: number; createdAt: string | number }[] | null;
  sourceInventories?: {
    id: string;
    productType: string;
    productId: string;
    sourceId: string;
    stock: number;
    costHistory: { value: number; createdAt: string | number }[];
    source?: { id: string; source: string } | null;
  }[];
  
  createdAt: string;
  updatedAt: string;
}

export interface TiresState {
  tires: Tire[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
