import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TiresState, Tire } from '../types/tireTypes';

const initialState: TiresState = {
  tires: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchTires = createAsyncThunk(
  'tires/fetchTires',
  async (params: {
    page?: number;
    limit?: number;
    search?: string;
    sidewallCategory?: string;
    publishStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    isActive?: boolean;
  }) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      sidewallCategory = '',
      publishStatus = '',
      sortBy = 'sku',
      sortOrder = 'asc',
      isActive,
    } = params;
    let url = `/api/admin/tires?page=${page}&limit=${limit}&search=${search}&sidewallCategory=${sidewallCategory}&publishStatus=${publishStatus}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
    if (isActive !== undefined) url += `&isActive=${isActive}`;
    const response = await axios.get(url);
    return response.data;
  }
);

export const createTire = createAsyncThunk(
  'tires/createTire',
  async (data: any) => {
    const response = await axios.post('/api/admin/tires', data);
    return response.data;
  }
);

export const updateTire = createAsyncThunk(
  'tires/updateTire',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await axios.put(`/api/admin/tires/${id}`, data);
    return response.data;
  }
);

export const deleteTire = createAsyncThunk(
  'tires/deleteTire',
  async (id: string) => {
    await axios.delete(`/api/admin/tires/${id}`);
    return id;
  }
);

export const bulkUpdateTires = createAsyncThunk(
  'tires/bulkUpdateTires',
  async ({ ids, isActive }: { ids: string[]; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/tires', { ids, isActive });
      return { ids, isActive, data: response.data };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update tires'
      );
    }
  }
);

const tiresSlice = createSlice({
  name: 'tires',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTires.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTires.fulfilled, (state, action) => {
        state.loading = false;
        state.tires = action.payload.tires;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tires';
      })
      .addCase(createTire.fulfilled, (state, action) => {
        state.tires.unshift(action.payload);
      })
      .addCase(updateTire.fulfilled, (state, action) => {
        const index = state.tires.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tires[index] = action.payload;
        }
      })
      .addCase(deleteTire.fulfilled, (state, action) => {
        state.tires = state.tires.filter((t) => t.id !== action.payload);
      })
      .addCase(bulkUpdateTires.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateTires.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, isActive } = action.payload;
        state.tires = state.tires.map((t) =>
          ids.includes(t.id) ? { ...t, isActive } : t
        );
      })
      .addCase(bulkUpdateTires.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default tiresSlice.reducer;
