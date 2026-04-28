import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { Brand, BrandsState } from '../types/brandTypes';

const initialState: BrandsState = {
  brands: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchBrands = createAsyncThunk(
  'brands/fetchBrands',
  async ({ page, limit, category, search }: { page: number; limit: number; category: string; search: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/brands?page=${page}&limit=${limit}&category=${category}&search=${search}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch brands');
    }
  }
);

export const createBrand = createAsyncThunk(
  'brands/createBrand',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await api.post('/brands', formData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create brand');
    }
  }
);

export const updateBrand = createAsyncThunk(
  'brands/updateBrand',
  async ({ id, formData }: { id: string; formData: FormData }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/brands/${id}`, formData);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update brand');
    }
  }
);

export const deleteBrand = createAsyncThunk(
  'brands/deleteBrand',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/brands/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete brand');
    }
  }
);

const brandsSlice = createSlice({
  name: 'brands',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBrands.fulfilled, (state, action: PayloadAction<{ brands: Brand[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.brands = action.payload.brands;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchBrands.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBrand.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBrand.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteBrand.fulfilled, (state, action: PayloadAction<string>) => {
        state.brands = state.brands.filter((b) => b.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError } = brandsSlice.actions;
export default brandsSlice.reducer;
