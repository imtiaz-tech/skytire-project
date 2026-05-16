import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { InventorySource, InventorySourcesState } from '../types/inventorySourceTypes';

const initialState: InventorySourcesState = {
  inventorySources: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchInventorySources = createAsyncThunk(
  'inventorySources/fetchInventorySources',
  async ({ page, limit, search }: { page: number; limit: number; search: string }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/admin/inventory-sources?page=${page}&limit=${limit}&search=${search}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch inventory sources');
    }
  }
);

export const createInventorySource = createAsyncThunk(
  'inventorySources/createInventorySource',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/inventory-sources', data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to create inventory source');
    }
  }
);

export const updateInventorySource = createAsyncThunk(
  'inventorySources/updateInventorySource',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/inventory-sources/${id}`, data);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update inventory source');
    }
  }
);

export const deleteInventorySource = createAsyncThunk(
  'inventorySources/deleteInventorySource',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/inventory-sources/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to delete inventory source');
    }
  }
);

const inventorySourcesSlice = createSlice({
  name: 'inventorySources',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventorySources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventorySources.fulfilled, (state, action: PayloadAction<{ inventorySources: InventorySource[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.inventorySources = action.payload.inventorySources;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchInventorySources.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createInventorySource.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateInventorySource.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteInventorySource.fulfilled, (state, action: PayloadAction<string>) => {
        state.inventorySources = state.inventorySources.filter((s) => s.id !== action.payload);
        state.total -= 1;
      });
  },
});

export const { clearError } = inventorySourcesSlice.actions;
export default inventorySourcesSlice.reducer;
