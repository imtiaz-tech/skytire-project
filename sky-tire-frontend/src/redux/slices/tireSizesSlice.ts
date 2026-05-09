import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TireSize, TireSizesState } from '../types/tireSizeTypes';

const initialState: TireSizesState = {
  tireSizes: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchTireSizes = createAsyncThunk(
  'tireSizes/fetchTireSizes',
  async ({ page, limit, search }: { page: number; limit: number; search: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/admin/tire-sizes?page=${page}&limit=${limit}&search=${search}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch tire sizes');
    }
  }
);

export const createTireSize = createAsyncThunk(
  'tireSizes/createTireSize',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/tire-sizes', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create tire size');
    }
  }
);

export const updateTireSize = createAsyncThunk(
  'tireSizes/updateTireSize',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/tire-sizes/${id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update tire size');
    }
  }
);

export const deleteTireSize = createAsyncThunk(
  'tireSizes/deleteTireSize',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/tire-sizes/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete tire size');
    }
  }
);

const tireSizesSlice = createSlice({
  name: 'tireSizes',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTireSizes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTireSizes.fulfilled, (state, action: PayloadAction<{ tireSizes: TireSize[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.tireSizes = action.payload.tireSizes;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTireSizes.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTireSize.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateTireSize.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteTireSize.fulfilled, (state, action: PayloadAction<string>) => {
        state.tireSizes = state.tireSizes.filter((s) => s.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError } = tireSizesSlice.actions;
export default tireSizesSlice.reducer;
