export interface CompetitorRow {
  productId: string;
  title: string;
  salePrice: number;
  regularPrice: number;
  stock: number;
  url: string;
}

/** sheetName -> productId(normalized) -> row */
export type ScrapedData = Record<string, Record<string, CompetitorRow>>;

export interface CompetitorMatch {
  name: string;
  title: string;
  salePrice: number;
  regularPrice: number;
  stock: number;
  url: string;
  diff: number;
}

export interface CompetitorProduct {
  id: string;
  sku: string;
  brand: string;
  model: string;
  productName: string;
  tireSize: string;
  cost: number;
  shipping: number;
  financeCost: number;
  netCost: number;
  salePrice: number;
  regularPrice: number;
  mapPrice: number;
  stock: number;
  updatedAt: string;
}

export interface SkippedProduct {
  productId?: string;
  sku: string;
  brand: string;
  model: string;
  productName: string;
  currentSalePrice?: number;
  currentRegularPrice?: number;
  attemptedSalePrice?: number;
  attemptedRegularPrice?: number;
  mapPrice?: number;
  competitor: string;
  reason: string;
}

export interface BulkSaleUpdateItem {
  productId: string;
  salePrice: number;
  competitor: string;
}

export interface BulkRegularUpdateItem {
  productId: string;
  regularPrice: number;
  competitor: string;
}

export interface PriceHistoryEntry {
  id: string;
  type: 'sale' | 'regular';
  previousPrice: number;
  updatedPrice: number;
  competitor: string;
  updatedAt: string;
}

/** Product with full priceHistory from backend (for Price Match Summary) */
export interface ProductWithPriceHistory {
  productId: string;
  sku: string;
  brand: string;
  model: string;
  productName: string;
  cost: number;
  salePrice: number;
  mapPrice: number;
  regularPrice: number;
  stock: number;
  /** Complete history — UI picks latest only */
  priceHistory: PriceHistoryEntry[];
}

/** One row in Price Match Summary modal / CSV (latest history only) */
export interface PriceUpdateHistoryRow {
  id: string;
  productId: string;
  sku: string;
  brand: string;
  model: string;
  productName: string;
  cost: number;
  salePrice: number;
  mapPrice: number;
  regularPrice: number;
  stock: number;
  previousPrice: number;
  updatedPrice: number;
  competitor: string;
  date: string;
  priceType?: 'SALE' | 'REGULAR';
}

export interface CompetitorPricingState {
  products: CompetitorProduct[];
  loading: boolean;
  updating: boolean;
  error: string | null;
  total: number;

  scrapedData: ScrapedData;
  sheetNames: string[];

  /** productId -> suggested sale price */
  updatedPrices: Record<string, number>;
  /** productId -> suggested regular price */
  updatedRegularPrices: Record<string, number>;
  /** productIds selected for sale update */
  selectedSkus: string[];
  /** productIds selected for regular update */
  selectedRegularSkus: string[];
  /** productId -> competitor sheet name for sale */
  selectedSaleCompetitorName: Record<string, string>;
  /** productId -> competitor sheet name for regular */
  selectedRegularCompetitorName: Record<string, string>;

  skippedProducts: SkippedProduct[];

  /** Which competitor bulk "Set X Sale Prices" is currently active */
  activeSaleSourceCompetitor: string | null;
  /** Which competitor bulk "Set X Regular Prices" is currently active */
  activeRegularSourceCompetitor: string | null;

  priceHistory: PriceUpdateHistoryRow[];
  /** Products with full history arrays (before latest-only reduction) */
  productsWithHistory: ProductWithPriceHistory[];
  historyLoading: boolean;
  historyType: 'sale' | 'regular';

  /**
   * True after lowest-competitor auto-selection has run once for the current upload.
   * Prevents re-selecting products after the user clicks Yes/No.
   */
  selectionsInitialized: boolean;
}
