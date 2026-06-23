import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Coupon, CouponsState } from '../types/couponTypes';

const initialState: CouponsState = {
  coupons: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchCoupons = createAsyncThunk(
  'coupons/fetchCoupons',
  async (params: { page: number; limit: number; search: string } | undefined, { rejectWithValue }) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const search = params?.search || '';
      const response = await axios.get(
        `/api/admin/coupons?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`
      );
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch coupons'
      );
    }
  }
);

export const createCoupon = createAsyncThunk(
  'coupons/createCoupon',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/coupons', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to create coupon'
      );
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'coupons/updateCoupon',
  async ({ id, data }: { id: string; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/coupons/${id}`, data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update coupon'
      );
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'coupons/deleteCoupon',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/coupons/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to delete coupon'
      );
    }
  }
);

const couponsSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCoupons.fulfilled,
        (
          state,
          action: PayloadAction<{
            coupons: Coupon[];
            total: number;
            pages: number;
            currentPage: number;
          }>
        ) => {
          state.loading = false;
          state.coupons = action.payload.coupons;
          state.total = action.payload.total;
          state.pages = action.payload.pages;
          state.currentPage = action.payload.currentPage;
        }
      )
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter((c) => c.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError } = couponsSlice.actions;
export default couponsSlice.reducer;
