import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Accessory, AccessoriesState } from '@/redux/types/accessoryTypes';

const initialState: AccessoriesState = {
  accessories: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchAccessories = createAsyncThunk(
  'accessories/fetchAccessories',
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: string;
      isVisible?: boolean;
    } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const { page = 1, limit = 10, search = '', status = '', sortBy = 'sku', sortOrder = 'asc', isVisible } = params || {};
      let url = `/api/admin/accessories?page=${page}&limit=${limit}&search=${search}&publishStatus=${status}&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (isVisible !== undefined) url += `&isVisible=${isVisible}`;
      const response = await axios.get(url);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch accessories');
    }
  }
);

export const createAccessory = createAsyncThunk(
  'accessories/createAccessory',
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/accessories', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create accessory');
    }
  }
);

export const updateAccessory = createAsyncThunk(
  'accessories/updateAccessory',
  async ({ id, data }: { id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/accessories/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update accessory');
    }
  }
);

export const deleteAccessory = createAsyncThunk(
  'accessories/deleteAccessory',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/accessories/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete accessory');
    }
  }
);

export const bulkUpdateAccessories = createAsyncThunk(
  'accessories/bulkUpdateAccessories',
  async ({ ids, isVisible }: { ids: string[]; isVisible: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch('/api/admin/accessories', { ids, isVisible });
      return { ids, isVisible, data: response.data };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      return rejectWithValue(error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update accessories');
    }
  }
);

const accessorySlice = createSlice({
  name: 'accessories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    bulkUpdateLocal: (state, action: PayloadAction<{ ids: string[]; isVisible: boolean }>) => {
      const { ids, isVisible } = action.payload;
      state.accessories = state.accessories.map((a) =>
        ids.includes(a.id) ? { ...a, isVisible } : a
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccessories.fulfilled, (state, action: PayloadAction<{ accessories: Accessory[]; total: number; pages: number; currentPage: number }>) => {
        state.loading = false;
        state.accessories = action.payload.accessories;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchAccessories.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAccessory.pending, (state) => {
        state.loading = true;
      })
      .addCase(createAccessory.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createAccessory.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateAccessory.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateAccessory.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateAccessory.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteAccessory.fulfilled, (state, action: PayloadAction<string>) => {
        state.accessories = state.accessories.filter((a) => a.id !== action.payload);
        state.total -= 1;
      })
      .addCase(bulkUpdateAccessories.pending, (state) => {
        state.loading = true;
      })
      .addCase(bulkUpdateAccessories.fulfilled, (state, action) => {
        state.loading = false;
        const { ids, isVisible } = action.payload;
        state.accessories = state.accessories.map((a) =>
          ids.includes(a.id) ? { ...a, isVisible } : a
        );
      })
      .addCase(bulkUpdateAccessories.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, bulkUpdateLocal } = accessorySlice.actions;
export default accessorySlice.reducer;
