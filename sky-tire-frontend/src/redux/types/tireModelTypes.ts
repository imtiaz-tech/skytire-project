import { Brand } from "./brandTypes";

export interface TireModel {
  id: string;
  brandId: string;
  modelName: string;
  images: string[];
  description?: string;
  keywords?: string;
  season?: string;
  performance?: string;
  
  // New fields
  treadDesign?: string;
  runFlat: boolean;
  threePMS: boolean;
  warranty?: string;
  treadLife?: string;

  brand?: Brand;
  createdAt: string;
  updatedAt: string;
}

export interface TireModelsState {
  tireModels: TireModel[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
