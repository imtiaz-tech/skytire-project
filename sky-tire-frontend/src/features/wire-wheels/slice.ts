import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { WireWheel, WireWheelsState } from '../../redux/types/wireWheelTypes';

const initialState: WireWheelsState = {
  wireWheels: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchWireWheels = createAsyncThunk(
  'wireWheels/fetchWireWheels',
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
      let url = `/api/admin/wire-wheels?page=${page}&limit=${limit}&search=${search}&publishStatus=${status}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (isActive !== undefined) url += `&isActive=${isActive}`;
      const response = await axios.get(url);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch wire wheels');
    }
  }
);

export const createWireWheel = createAsyncThunk(
  'wireWheels/createWireWheel',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/wire-wheels', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create wire wheel');
    }
  }
);

export const updateWireWheel = createAsyncThunk(
  'wireWheels/updateWireWheel',
  async ({ id, data }: { id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/wire-wheels/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update wire wheel');
    }
  }
);

export const deleteWireWheel = createAsyncThunk(
  'wireWheels/deleteWireWheel',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/wire-wheels/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete wire wheel');
    }
  }
);

export const bulkUpdateWireWheels = createAsyncThunk(
  'wireWheels/bulkUpdateWireWheels',
  async ({ ids, isActive }: { ids: string[]; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/wire-wheels', { ids, isActive });
      return { ids, isActive, data: response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update wire wheels');
    }
  }
);

const wireWheelSlice = createSlice({
  name: 'wireWheels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    bulkUpdateLocal: (state, action: PayloadAction<{ ids: string[]; isActive: boolean }>) => {
      const { ids, isActive } = action.payload;
      state.wireWheels = state.wireWheels.map((w) =>
        ids.includes(w.id) ? { ...w, isActive } : w
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWireWheels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWireWheels.fulfilled, (state, action: PayloadAction<{ wireWheels: WireWheel[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.wireWheels = action.payload.wireWheels;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchWireWheels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createWireWheel.pending, (state) => {
        state.loading = true;
      })
      .addCase(createWireWheel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createWireWheel.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateWireWheel.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateWireWheel.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateWireWheel.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteWireWheel.fulfilled, (state, action: PayloadAction<string>) => {
        state.wireWheels = state.wireWheels.filter((w) => w.id !== action.payload);
        state.total -= 1;
      })
      .addCase(bulkUpdateWireWheels.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateWireWheels.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, isActive } = action.payload;
        state.wireWheels = state.wireWheels.map((w) =>
          ids.includes(w.id) ? { ...w, isActive } : w
        );
      })
      .addCase(bulkUpdateWireWheels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, bulkUpdateLocal } = wireWheelSlice.actions;
export default wireWheelSlice.reducer;
