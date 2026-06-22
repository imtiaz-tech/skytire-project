export interface AccessoryCategoryItem {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccessoryCategoriesState {
  categories: AccessoryCategoryItem[];
  loading: boolean;
  error: string | null;
}
