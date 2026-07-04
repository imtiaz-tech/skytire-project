import { PriceMatchProductType } from '@prisma/client';

export interface PriceMatchQueryProduct {
  productId: string;
  productType: PriceMatchProductType;
  productName: string;
  brandName: string;
  modelName: string | null;
  tireSize: string | null;
  salePrice: number;
  images: string[];
}

export interface PriceMatchQuery {
  id: string;
  productId: string;
  productType: PriceMatchProductType;
  competitorURL: string;
  competitor: string;
  competitorPrice: string;
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  product: PriceMatchQueryProduct | null;
}

export interface PriceMatchQueriesState {
  queries: PriceMatchQuery[];
  selectedQuery: PriceMatchQuery | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
  unreadCount: number;
}
