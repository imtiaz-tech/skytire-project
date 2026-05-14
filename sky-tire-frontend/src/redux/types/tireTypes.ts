export interface InventorySource {
  id: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tire {
  id: string;
  modelId: string;
  sku: string;
  alternatePartNumber?: string;
  upcNo?: string;
  stock: number;
  cost: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  shippingCost: number;
  handlingFee: number;
  freightCharges: number;
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
  sidewallCategory?: 'BLACK_WALL' | 'WHITE_WALL';
  sidewallDetail?: string;
  publishStatus?: 'PUBLISHED' | 'DRAFT';

  model?: any; // Will be properly typed if needed
  sources?: InventorySource[];
  
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
