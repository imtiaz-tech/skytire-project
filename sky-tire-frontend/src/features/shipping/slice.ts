import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Shipping, ShippingCategory, ShippingState } from '@/redux/types/shippingTypes';

const initialState: ShippingState = {
  shippings: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export type ShippingPayload = {
  size?: string | null;
  accessoryCategoryId?: string | null;
  weight: number;
  length: number;
  width: number;
  height: number;
  shippingRate: number;
};

export const fetchShippings = createAsyncThunk(
  'shipping/fetchShippings',
  async (
    params: { category: ShippingCategory; page: number; limit: number; search: string },
    { rejectWithValue },
  ) => {
    try {
      const { category, page, limit, search } = params;
      const response = await axios.get('/api/admin/shipping', {
        params: { category, page, limit, search },
      });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch shipping records',
      );
    }
  },
);

export const createShipping = createAsyncThunk(
  'shipping/createShipping',
  async (
    data: ShippingPayload & { category: ShippingCategory },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.post('/api/admin/shipping', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to create shipping record',
      );
    }
  },
);

export const updateShipping = createAsyncThunk(
  'shipping/updateShipping',
  async (
    { id, data }: { id: string; data: ShippingPayload },
    { rejectWithValue },
  ) => {
    try {
      const response = await axios.put(`/api/admin/shipping/${id}`, data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update shipping record',
      );
    }
  },
);

export const deleteShipping = createAsyncThunk(
  'shipping/deleteShipping',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/shipping/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to delete shipping record',
      );
    }
  },
);

const shippingSlice = createSlice({
  name: 'shipping',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShippings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchShippings.fulfilled,
        (
          state,
          action: PayloadAction<{
            shippings: Shipping[];
            total: number;
            pages: number;
            currentPage: number;
          }>,
        ) => {
          state.loading = false;
          state.shippings = action.payload.shippings;
          state.total = action.payload.total;
          state.pages = action.payload.pages;
          state.currentPage = action.payload.currentPage;
        },
      )
      .addCase(fetchShippings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createShipping.pending, (state) => {
        state.loading = true;
      })
      .addCase(createShipping.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createShipping.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateShipping.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateShipping.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateShipping.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteShipping.fulfilled, (state, action: PayloadAction<string>) => {
        state.shippings = state.shippings.filter((s) => s.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { clearError } = shippingSlice.actions;
export default shippingSlice.reducer;
