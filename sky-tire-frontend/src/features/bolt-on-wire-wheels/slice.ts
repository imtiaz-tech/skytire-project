import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BoltOnWireWheel, BoltOnWireWheelsState } from '../../redux/types/boltOnWireWheelTypes';

const initialState: BoltOnWireWheelsState = {
  boltOnWireWheels: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchBoltOnWireWheels = createAsyncThunk(
  'boltOnWireWheels/fetchBoltOnWireWheels',
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
      isActive?: boolean;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', sortBy = 'sku', sortOrder = 'asc', isActive } = params || {};
      let url = `/api/admin/bolt-on-wire-wheels?page=${page}&limit=${limit}&search=${search}&publishStatus=${status}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (isActive !== undefined) url += `&isActive=${isActive}`;
      const response = await axios.get(url);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch bolt-on wire wheels');
    }
  }
);

export const createBoltOnWireWheel = createAsyncThunk(
  'boltOnWireWheels/createBoltOnWireWheel',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/bolt-on-wire-wheels', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create bolt-on wire wheel');
    }
  }
);

export const updateBoltOnWireWheel = createAsyncThunk(
  'boltOnWireWheels/updateBoltOnWireWheel',
  async ({ id, data }: { id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/bolt-on-wire-wheels/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update bolt-on wire wheel');
    }
  }
);

export const deleteBoltOnWireWheel = createAsyncThunk(
  'boltOnWireWheels/deleteBoltOnWireWheel',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/bolt-on-wire-wheels/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete bolt-on wire wheel');
    }
  }
);

export const bulkUpdateBoltOnWireWheels = createAsyncThunk(
  'boltOnWireWheels/bulkUpdateBoltOnWireWheels',
  async ({ ids, isActive }: { ids: string[]; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/bolt-on-wire-wheels', { ids, isActive });
      return { ids, isActive, data: response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update bolt-on wire wheels');
    }
  }
);

const boltOnWireWheelSlice = createSlice({
  name: 'boltOnWireWheels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    bulkUpdateLocal: (state, action: PayloadAction<{ ids: string[]; isActive: boolean }>) => {
      const { ids, isActive } = action.payload;
      state.boltOnWireWheels = state.boltOnWireWheels.map((w) =>
        ids.includes(w.id) ? { ...w, isActive } : w
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoltOnWireWheels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoltOnWireWheels.fulfilled, (state, action: PayloadAction<{ boltOnWireWheels: BoltOnWireWheel[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.boltOnWireWheels = action.payload.boltOnWireWheels;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchBoltOnWireWheels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createBoltOnWireWheel.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBoltOnWireWheel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createBoltOnWireWheel.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateBoltOnWireWheel.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBoltOnWireWheel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBoltOnWireWheel.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteBoltOnWireWheel.fulfilled, (state, action: PayloadAction<string>) => {
        state.boltOnWireWheels = state.boltOnWireWheels.filter((w) => w.id !== action.payload);
        state.total -= 1;
      })
      .addCase(bulkUpdateBoltOnWireWheels.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateBoltOnWireWheels.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, isActive } = action.payload;
        state.boltOnWireWheels = state.boltOnWireWheels.map((w) =>
          ids.includes(w.id) ? { ...w, isActive } : w
        );
      })
      .addCase(bulkUpdateBoltOnWireWheels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, bulkUpdateLocal } = boltOnWireWheelSlice.actions;
export default boltOnWireWheelSlice.reducer;
