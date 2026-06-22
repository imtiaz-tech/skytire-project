import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  AccessoryCategoriesState,
  AccessoryCategoryItem,
} from '@/redux/types/accessoryCategoryTypes';

const initialState: AccessoryCategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchAccessoryCategories = createAsyncThunk(
  'accessoryCategories/fetchAccessoryCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/accessory-categories');
      return response.data as AccessoryCategoryItem[];
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch accessory categories',
      );
    }
  },
);

export const createAccessoryCategory = createAsyncThunk(
  'accessoryCategories/createAccessoryCategory',
  async (name: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/accessory-categories', { name });
      return response.data as AccessoryCategoryItem;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to create accessory category',
      );
    }
  },
);

const accessoryCategoriesSlice = createSlice({
  name: 'accessoryCategories',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccessoryCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAccessoryCategories.fulfilled,
        (state, action: PayloadAction<AccessoryCategoryItem[]>) => {
          state.loading = false;
          state.categories = action.payload;
        },
      )
      .addCase(fetchAccessoryCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAccessoryCategory.fulfilled, (state, action: PayloadAction<AccessoryCategoryItem>) => {
        const exists = state.categories.some((c) => c.id === action.payload.id);
        if (!exists) {
          state.categories = [...state.categories, action.payload].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
        }
      });
  },
});

export const { clearError } = accessoryCategoriesSlice.actions;
export default accessoryCategoriesSlice.reducer;
