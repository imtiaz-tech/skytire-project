import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  BulkRegularUpdateItem,
  BulkSaleUpdateItem,
  CompetitorPricingState,
  CompetitorProduct,
  ProductWithPriceHistory,
  ScrapedData,
  SkippedProduct,
} from '@/redux/types/competitorPricingTypes';
import {
  buildLatestPriceSummaryRows,
  findPrioritySheetName,
  getCompetitorsForProduct,
  pickLowestCompetitor,
} from '@/lib/competitorPricing';

const initialState: CompetitorPricingState = {
  products: [],
  loading: false,
  updating: false,
  error: null,
  total: 0,
  scrapedData: {},
  sheetNames: [],
  updatedPrices: {},
  updatedRegularPrices: {},
  selectedSkus: [],
  selectedRegularSkus: [],
  selectedSaleCompetitorName: {},
  selectedRegularCompetitorName: {},
  skippedProducts: [],
  activeSaleSourceCompetitor: null,
  activeRegularSourceCompetitor: null,
  priceHistory: [],
  productsWithHistory: [],
  historyLoading: false,
  historyType: 'sale',
};

export const fetchCompetitorProducts = createAsyncThunk(
  'competitorPricing/fetchProducts',
  async (params: { search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/competitor-pricing', {
        params: { search: params?.search || '', limit: 50000 },
      });
      return response.data as { products: CompetitorProduct[]; total: number };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch products'
      );
    }
  }
);

export const bulkUpdateSalePrices = createAsyncThunk(
  'competitorPricing/bulkUpdateSale',
  async (updates: BulkSaleUpdateItem[], { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/competitor-pricing/bulk-sale', {
        updates,
      });
      return response.data as {
        updated: number;
        skipped: SkippedProduct[];
        message: string;
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update sale prices'
      );
    }
  }
);

export const bulkUpdateRegularPrices = createAsyncThunk(
  'competitorPricing/bulkUpdateRegular',
  async (updates: BulkRegularUpdateItem[], { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/competitor-pricing/bulk-regular', {
        updates,
      });
      return response.data as {
        updated: number;
        skipped: SkippedProduct[];
        message: string;
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update regular prices'
      );
    }
  }
);

export const fetchPriceUpdateHistory = createAsyncThunk(
  'competitorPricing/fetchPriceUpdateHistory',
  async (
    params: { startDate: string; endDate: string; type: 'sale' | 'regular' },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get('/api/admin/competitor-pricing/history', {
        params,
      });
      return response.data as {
        products: ProductWithPriceHistory[];
        type: 'sale' | 'regular';
        total: number;
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch price history'
      );
    }
  }
);

function applyLowestMatches(
  products: CompetitorProduct[],
  scrapedData: ScrapedData,
  sheetNames: string[]
) {
  const updatedPrices: Record<string, number> = {};
  const updatedRegularPrices: Record<string, number> = {};
  const selectedSkus: string[] = [];
  const selectedRegularSkus: string[] = [];
  const selectedSaleCompetitorName: Record<string, string> = {};
  const selectedRegularCompetitorName: Record<string, string> = {};

  for (const product of products) {
    const competitors = getCompetitorsForProduct(
      product.id,
      scrapedData,
      sheetNames,
      product.salePrice
    );
    const lowest = pickLowestCompetitor(competitors);
    if (!lowest) continue;

    updatedPrices[product.id] = lowest.salePrice;
    selectedSkus.push(product.id);
    selectedSaleCompetitorName[product.id] = lowest.name;

    if (lowest.regularPrice > 0) {
      updatedRegularPrices[product.id] = lowest.regularPrice;
      selectedRegularSkus.push(product.id);
      selectedRegularCompetitorName[product.id] = lowest.name;
    }
  }

  return {
    updatedPrices,
    updatedRegularPrices,
    selectedSkus,
    selectedRegularSkus,
    selectedSaleCompetitorName,
    selectedRegularCompetitorName,
  };
}

const competitorPricingSlice = createSlice({
  name: 'competitorPricing',
  initialState,
  reducers: {
    setScrapedData(
      state,
      action: PayloadAction<{ scrapedData: ScrapedData; sheetNames: string[] }>
    ) {
      state.scrapedData = action.payload.scrapedData;
      state.sheetNames = action.payload.sheetNames;

      const matched = applyLowestMatches(
        state.products,
        action.payload.scrapedData,
        action.payload.sheetNames
      );
      Object.assign(state, matched);
      state.skippedProducts = [];
      state.activeSaleSourceCompetitor = null;
      state.activeRegularSourceCompetitor = null;
    },

    clearScrapedData(state) {
      state.scrapedData = {};
      state.sheetNames = [];
      state.updatedPrices = {};
      state.updatedRegularPrices = {};
      state.selectedSkus = [];
      state.selectedRegularSkus = [];
      state.selectedSaleCompetitorName = {};
      state.selectedRegularCompetitorName = {};
      state.skippedProducts = [];
      state.activeSaleSourceCompetitor = null;
      state.activeRegularSourceCompetitor = null;
    },

    setSalePrice(
      state,
      action: PayloadAction<{ productId: string; price: number }>
    ) {
      const { productId, price } = action.payload;
      if (!price || price <= 0) {
        delete state.updatedPrices[productId];
      } else {
        state.updatedPrices[productId] = price;
      }
    },

    setRegularPrice(
      state,
      action: PayloadAction<{ productId: string; price: number }>
    ) {
      const { productId, price } = action.payload;
      if (!price || price <= 0) {
        delete state.updatedRegularPrices[productId];
      } else {
        state.updatedRegularPrices[productId] = price;
      }
    },

    toggleSaleSelection(
      state,
      action: PayloadAction<{ productId: string; selected: boolean }>
    ) {
      const { productId, selected } = action.payload;
      if (selected) {
        if (!state.selectedSkus.includes(productId)) {
          state.selectedSkus.push(productId);
        }
      } else {
        state.selectedSkus = state.selectedSkus.filter((id) => id !== productId);
      }
    },

    toggleRegularSelection(
      state,
      action: PayloadAction<{ productId: string; selected: boolean }>
    ) {
      const { productId, selected } = action.payload;
      if (selected) {
        if (!state.selectedRegularSkus.includes(productId)) {
          state.selectedRegularSkus.push(productId);
        }
      } else {
        state.selectedRegularSkus = state.selectedRegularSkus.filter(
          (id) => id !== productId
        );
      }
    },

    selectAllMinPrices(state) {
      const ids = Object.keys(state.updatedPrices);
      state.selectedSkus = [...ids];
    },

    selectAllRegularPrices(state) {
      const ids = Object.keys(state.updatedRegularPrices);
      state.selectedRegularSkus = [...ids];
    },

    setSaleCompetitorForProduct(
      state,
      action: PayloadAction<{ productId: string; competitor: string }>
    ) {
      const { productId, competitor } = action.payload;
      state.selectedSaleCompetitorName[productId] = competitor;
      const key = productId.trim().toLowerCase();
      const matched = state.scrapedData[competitor]?.[key];
      if (matched?.salePrice > 0) {
        state.updatedPrices[productId] = matched.salePrice;
        if (!state.selectedSkus.includes(productId)) {
          state.selectedSkus.push(productId);
        }
        if (matched.regularPrice > 0) {
          state.updatedRegularPrices[productId] = matched.regularPrice;
          state.selectedRegularCompetitorName[productId] = competitor;
          if (!state.selectedRegularSkus.includes(productId)) {
            state.selectedRegularSkus.push(productId);
          }
        }
      }
    },

    applyCompetitorToSelectedSale(
      state,
      action: PayloadAction<{ competitor: string; productIds: string[] }>
    ) {
      const { competitor, productIds } = action.payload;
      for (const productId of productIds) {
        const key = productId.trim().toLowerCase();
        const matched = state.scrapedData[competitor]?.[key];
        if (!matched || matched.salePrice <= 0) continue;
        state.updatedPrices[productId] = matched.salePrice;
        state.selectedSaleCompetitorName[productId] = competitor;
        if (!state.selectedSkus.includes(productId)) {
          state.selectedSkus.push(productId);
        }
      }
    },

    applyCompetitorToSelectedRegular(
      state,
      action: PayloadAction<{ competitor: string; productIds: string[] }>
    ) {
      const { competitor, productIds } = action.payload;
      for (const productId of productIds) {
        const key = productId.trim().toLowerCase();
        const matched = state.scrapedData[competitor]?.[key];
        if (!matched || matched.regularPrice <= 0) continue;
        state.updatedRegularPrices[productId] = matched.regularPrice;
        state.selectedRegularCompetitorName[productId] = competitor;
        if (!state.selectedRegularSkus.includes(productId)) {
          state.selectedRegularSkus.push(productId);
        }
      }
    },

    /**
     * Apply one competitor's sale prices to all matched products.
     * Marks this competitor as the active bulk sale source.
     */
    setCompetitorSalePrices(state, action: PayloadAction<string>) {
      const competitor = action.payload;
      if (!state.scrapedData[competitor]) return;

      state.activeSaleSourceCompetitor = competitor;

      for (const product of state.products) {
        const key = product.id.trim().toLowerCase();
        const matched = state.scrapedData[competitor]?.[key];
        if (!matched || matched.salePrice <= 0) continue;

        state.updatedPrices[product.id] = matched.salePrice;
        state.selectedSaleCompetitorName[product.id] = competitor;
        if (!state.selectedSkus.includes(product.id)) {
          state.selectedSkus.push(product.id);
        }
      }
    },

    /**
     * Apply one competitor's regular prices to all matched products.
     * Marks this competitor as the active bulk regular source.
     */
    setCompetitorRegularPrices(state, action: PayloadAction<string>) {
      const competitor = action.payload;
      if (!state.scrapedData[competitor]) return;

      state.activeRegularSourceCompetitor = competitor;

      for (const product of state.products) {
        const key = product.id.trim().toLowerCase();
        const matched = state.scrapedData[competitor]?.[key];
        if (!matched || matched.regularPrice <= 0) continue;

        state.updatedRegularPrices[product.id] = matched.regularPrice;
        state.selectedRegularCompetitorName[product.id] = competitor;
        if (!state.selectedRegularSkus.includes(product.id)) {
          state.selectedRegularSkus.push(product.id);
        }
      }
    },

    /** Per-row: click a competitor sale price button (independent of regular). */
    selectCompetitorSaleForProduct(
      state,
      action: PayloadAction<{ productId: string; competitor: string }>
    ) {
      const { productId, competitor } = action.payload;
      const key = productId.trim().toLowerCase();
      const matched = state.scrapedData[competitor]?.[key];
      if (!matched || matched.salePrice <= 0) return;

      state.updatedPrices[productId] = matched.salePrice;
      state.selectedSaleCompetitorName[productId] = competitor;
      if (!state.selectedSkus.includes(productId)) {
        state.selectedSkus.push(productId);
      }
    },

    /** Per-row: click a competitor regular price button (independent of sale). */
    selectCompetitorRegularForProduct(
      state,
      action: PayloadAction<{ productId: string; competitor: string }>
    ) {
      const { productId, competitor } = action.payload;
      const key = productId.trim().toLowerCase();
      const matched = state.scrapedData[competitor]?.[key];
      if (!matched || matched.regularPrice <= 0) return;

      state.updatedRegularPrices[productId] = matched.regularPrice;
      state.selectedRegularCompetitorName[productId] = competitor;
      if (!state.selectedRegularSkus.includes(productId)) {
        state.selectedRegularSkus.push(productId);
      }
    },

    // Keep aliases for Priority shortcuts
    setPrioritySalePrices(state) {
      const priority = findPrioritySheetName(state.sheetNames);
      if (!priority || !state.scrapedData[priority]) return;
      state.activeSaleSourceCompetitor = priority;
      for (const product of state.products) {
        const key = product.id.trim().toLowerCase();
        const matched = state.scrapedData[priority]?.[key];
        if (!matched || matched.salePrice <= 0) continue;
        state.updatedPrices[product.id] = matched.salePrice;
        state.selectedSaleCompetitorName[product.id] = priority;
        if (!state.selectedSkus.includes(product.id)) {
          state.selectedSkus.push(product.id);
        }
      }
    },

    setPriorityRegularPrices(state) {
      const priority = findPrioritySheetName(state.sheetNames);
      if (!priority || !state.scrapedData[priority]) return;
      state.activeRegularSourceCompetitor = priority;
      for (const product of state.products) {
        const key = product.id.trim().toLowerCase();
        const matched = state.scrapedData[priority]?.[key];
        if (!matched || matched.regularPrice <= 0) continue;
        state.updatedRegularPrices[product.id] = matched.regularPrice;
        state.selectedRegularCompetitorName[product.id] = priority;
        if (!state.selectedRegularSkus.includes(product.id)) {
          state.selectedRegularSkus.push(product.id);
        }
      }
    },

    clearSkippedProducts(state) {
      state.skippedProducts = [];
    },

    setSkippedProducts(state, action: PayloadAction<SkippedProduct[]>) {
      state.skippedProducts = action.payload;
    },

    clearPriceHistory(state) {
      state.priceHistory = [];
      state.productsWithHistory = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitorProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompetitorProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.total = action.payload.total;

        // Re-apply matches if scraped data already loaded
        if (state.sheetNames.length > 0) {
          const matched = applyLowestMatches(
            state.products,
            state.scrapedData,
            state.sheetNames
          );
          Object.assign(state, matched);
        }
      })
      .addCase(fetchCompetitorProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to fetch products';
      })
      .addCase(bulkUpdateSalePrices.pending, (state) => {
        state.updating = true;
      })
      .addCase(bulkUpdateSalePrices.fulfilled, (state, action) => {
        state.updating = false;
        state.skippedProducts = action.payload.skipped || [];

        // Refresh local sale prices for successfully updated items
        const skippedIds = new Set(
          (action.payload.skipped || [])
            .map((s) => s.productId || s.sku)
            .filter(Boolean)
        );
        for (const productId of state.selectedSkus) {
          if (skippedIds.has(productId)) continue;
          const product = state.products.find((p) => p.id === productId);
          if (!product) continue;
          if (skippedIds.has(product.sku)) continue;
          const newPrice = state.updatedPrices[productId];
          if (newPrice != null) {
            product.salePrice = newPrice;
          }
        }
      })
      .addCase(bulkUpdateSalePrices.rejected, (state, action) => {
        state.updating = false;
        state.error = (action.payload as string) || 'Failed to update sale prices';
      })
      .addCase(bulkUpdateRegularPrices.pending, (state) => {
        state.updating = true;
      })
      .addCase(bulkUpdateRegularPrices.fulfilled, (state, action) => {
        state.updating = false;
        state.skippedProducts = action.payload.skipped || [];

        const skippedIds = new Set(
          (action.payload.skipped || [])
            .map((s) => s.productId || s.sku)
            .filter(Boolean)
        );
        for (const productId of state.selectedRegularSkus) {
          if (skippedIds.has(productId)) continue;
          const product = state.products.find((p) => p.id === productId);
          if (!product) continue;
          if (skippedIds.has(product.sku)) continue;
          const newPrice = state.updatedRegularPrices[productId];
          if (newPrice != null) {
            product.regularPrice = newPrice;
          }
        }
      })
      .addCase(bulkUpdateRegularPrices.rejected, (state, action) => {
        state.updating = false;
        state.error = (action.payload as string) || 'Failed to update regular prices';
      })
      .addCase(fetchPriceUpdateHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchPriceUpdateHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        const selectedType = action.payload.type || 'sale';
        state.historyType = selectedType;
        // Keep full history on products; summary rows use latest only
        state.productsWithHistory = action.payload.products || [];
        state.priceHistory = buildLatestPriceSummaryRows(
          state.productsWithHistory,
          selectedType
        );
      })
      .addCase(fetchPriceUpdateHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch price history';
      });
  },
});

export const {
  setScrapedData,
  clearScrapedData,
  setSalePrice,
  setRegularPrice,
  toggleSaleSelection,
  toggleRegularSelection,
  selectAllMinPrices,
  selectAllRegularPrices,
  setSaleCompetitorForProduct,
  applyCompetitorToSelectedSale,
  applyCompetitorToSelectedRegular,
  setCompetitorSalePrices,
  setCompetitorRegularPrices,
  selectCompetitorSaleForProduct,
  selectCompetitorRegularForProduct,
  setPrioritySalePrices,
  setPriorityRegularPrices,
  clearSkippedProducts,
  setSkippedProducts,
  clearPriceHistory,
} = competitorPricingSlice.actions;

export default competitorPricingSlice.reducer;
