import { TireSize } from "./tireSizeTypes";

export interface InventorySource {
  id: string;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tire {
  id: string;
  tireSizeId: string;
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
  
  tireSize?: TireSize;
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
