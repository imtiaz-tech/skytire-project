import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { InventorySource } from '../types/tireTypes';

interface InventorySourcesState {
  sources: InventorySource[];
  loading: boolean;
  error: string | null;
}

const initialState: InventorySourcesState = {
  sources: [],
  loading: false,
  error: null,
};

export const fetchInventorySources = createAsyncThunk(
  'inventorySources/fetchInventorySources',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/inventory-sources');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch inventory sources');
    }
  }
);

export const createInventorySource = createAsyncThunk(
  'inventorySources/createInventorySource',
  async (source: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/inventory-sources', { source });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create inventory source');
    }
  }
);

export const updateInventorySource = createAsyncThunk(
  'inventorySources/updateInventorySource',
  async ({ id, source }: { id: string; source: string }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/inventory-sources/${id}`, { source });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update inventory source');
    }
  }
);

export const deleteInventorySource = createAsyncThunk(
  'inventorySources/deleteInventorySource',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/inventory-sources/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete inventory source');
    }
  }
);

const inventorySourcesSlice = createSlice({
  name: 'inventorySources',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventorySources.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchInventorySources.fulfilled, (state, action: PayloadAction<InventorySource[]>) => {
        state.loading = false;
        state.sources = action.payload;
      })
      .addCase(fetchInventorySources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createInventorySource.fulfilled, (state, action: PayloadAction<InventorySource>) => {
        state.sources.push(action.payload);
      })
      .addCase(updateInventorySource.fulfilled, (state, action: PayloadAction<InventorySource>) => {
        const index = state.sources.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.sources[index] = action.payload;
        }
      })
      .addCase(deleteInventorySource.fulfilled, (state, action: PayloadAction<string>) => {
        state.sources = state.sources.filter((s) => s.id !== action.payload);
      });
  },
});

export default inventorySourcesSlice.reducer;
