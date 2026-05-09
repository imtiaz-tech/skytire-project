import { TireModel } from "./tireModelTypes";

export interface TireSize {
  id: string;
  modelId: string;
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
  status?: string;
  vehicleType?: string;
  keywords?: string;
  sidewall?: string;

  model?: TireModel;
  createdAt: string;
  updatedAt: string;
}

export interface TireSizesState {
  tireSizes: TireSize[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
