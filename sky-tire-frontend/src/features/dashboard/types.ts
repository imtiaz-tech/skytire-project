export interface Analytics {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  recentOrders: any[];
}

export interface DashboardState {
  analytics: Analytics | null;
  loading: boolean;
  error: string | null;
}
