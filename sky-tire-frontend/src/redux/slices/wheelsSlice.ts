import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Wheel, WheelsState } from '../types/wheelTypes';


const initialState: WheelsState = {
  wheels: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchWheels = createAsyncThunk(
  'wheels/fetchWheels',
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
      let url = `/api/admin/wheels?page=${page}&limit=${limit}&search=${search}&publishStatus=${status}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (isActive !== undefined) url += `&isActive=${isActive}`;
      const response = await axios.get(url);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch wheels');
    }
  }
);

export const createWheel = createAsyncThunk(
  'wheels/createWheel',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/wheels', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create wheel');
    }
  }
);

export const updateWheel = createAsyncThunk(
  'wheels/updateWheel',
  async ({ id, data }: { id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/wheels/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update wheel');
    }
  }
);

export const deleteWheel = createAsyncThunk(
  'wheels/deleteWheel',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/wheels/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to delete wheel');
    }
  }
);

export const bulkUpdateWheels = createAsyncThunk(
  'wheels/bulkUpdateWheels',
  async ({ ids, isActive }: { ids: string[]; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/wheels', { ids, isActive });
      return { ids, isActive, data: response.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update wheels');
    }
  }
);

const wheelsSlice = createSlice({
  name: 'wheels',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    bulkUpdateLocal: (state, action: PayloadAction<{ ids: string[]; isActive: boolean }>) => {
      const { ids, isActive } = action.payload;
      state.wheels = state.wheels.map((w) =>
        ids.includes(w.id) ? { ...w, isActive } : w
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWheels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWheels.fulfilled, (state, action: PayloadAction<{ wheels: Wheel[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.wheels = action.payload.wheels;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchWheels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createWheel.pending, (state) => {
        state.loading = true;
      })
      .addCase(createWheel.fulfilled, (state, action: PayloadAction<Wheel>) => {
        state.loading = false;
      })
      .addCase(createWheel.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateWheel.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateWheel.fulfilled, (state, action: PayloadAction<Wheel>) => {
        state.loading = false;
      })
      .addCase(updateWheel.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteWheel.fulfilled, (state, action: PayloadAction<string>) => {
        state.wheels = state.wheels.filter((w) => w.id !== action.payload);
        state.total -= 1;
      })
      .addCase(bulkUpdateWheels.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateWheels.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, isActive } = action.payload;
        state.wheels = state.wheels.map((w) =>
          ids.includes(w.id) ? { ...w, isActive } : w
        );
      })
      .addCase(bulkUpdateWheels.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, bulkUpdateLocal } = wheelsSlice.actions;
export default wheelsSlice.reducer;
