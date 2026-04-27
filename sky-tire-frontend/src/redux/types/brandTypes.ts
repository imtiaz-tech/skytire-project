export type BrandCategory = 'tire' | 'wheel' | 'wire_wheel' | 'accessory' | 'bolt_on_wheels';

export interface Brand {
  id: string;
  brandName: string;
  brandLogo: string;
  category: BrandCategory;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandsState {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
