export interface InventorySource {
  id: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventorySourcesState {
  inventorySources: InventorySource[];
  loading: boolean;
  error: string | null;
  total: number;
  pages: number;
  currentPage: number;
}
