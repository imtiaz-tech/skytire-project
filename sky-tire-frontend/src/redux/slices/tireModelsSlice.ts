import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TireModel, TireModelsState } from '../types/tireModelTypes';

const initialState: TireModelsState = {
  tireModels: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchTireModels = createAsyncThunk(
  'tireModels/fetchTireModels',
  async ({ page, limit, search }: { page: number; limit: number; search: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/admin/tire-models?page=${page}&limit=${limit}&search=${search}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch tire models');
    }
  }
);

export const createTireModel = createAsyncThunk(
  'tireModels/createTireModel',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/tire-models', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create tire model');
    }
  }
);

export const updateTireModel = createAsyncThunk(
  'tireModels/updateTireModel',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/tire-models/${id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update tire model');
    }
  }
);

export const deleteTireModel = createAsyncThunk(
  'tireModels/deleteTireModel',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/tire-models/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete tire model');
    }
  }
);

const tireModelsSlice = createSlice({
  name: 'tireModels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTireModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTireModels.fulfilled, (state, action: PayloadAction<{ tireModels: TireModel[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.tireModels = action.payload.tireModels;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTireModels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createTireModel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateTireModel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteTireModel.fulfilled, (state, action: PayloadAction<string>) => {
        state.tireModels = state.tireModels.filter((m) => m.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError } = tireModelsSlice.actions;
export default tireModelsSlice.reducer;
