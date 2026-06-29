import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { PromoBar, PromoBarFormData, PromoBarsState } from '@/redux/types/promoBarTypes';

const initialState: PromoBarsState = {
  promoBars: [],
  settings: { autoplayDelay: 3000 },
  loading: false,
  savingSettings: false,
  error: null,
};

export const fetchPromoBars = createAsyncThunk(
  'promoBars/fetchPromoBars',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/promo-bars');
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch promo bars'
      );
    }
  }
);

export const createPromoBar = createAsyncThunk(
  'promoBars/createPromoBar',
  async (data: PromoBarFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/promo-bars', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to create promo bar'
      );
    }
  }
);

export const updatePromoBar = createAsyncThunk(
  'promoBars/updatePromoBar',
  async ({ id, data }: { id: string; data: PromoBarFormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/promo-bars/${id}`, data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update promo bar'
      );
    }
  }
);

export const deletePromoBar = createAsyncThunk(
  'promoBars/deletePromoBar',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/promo-bars/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to delete promo bar'
      );
    }
  }
);

export const updatePromoBarSettings = createAsyncThunk(
  'promoBars/updatePromoBarSettings',
  async (autoplayDelay: number, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/promo-bars/settings', { autoplayDelay });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update promo bar settings'
      );
    }
  }
);

export const reorderPromoBars = createAsyncThunk(
  'promoBars/reorderPromoBars',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/promo-bars/reorder', { ids });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to reorder promo bars'
      );
    }
  }
);

export const togglePromoBarActive = createAsyncThunk(
  'promoBars/togglePromoBarActive',
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/admin/promo-bars/${id}`, { isActive });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update promo bar status'
      );
    }
  }
);

const promoBarsSlice = createSlice({
  name: 'promoBars',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromoBars.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPromoBars.fulfilled,
        (
          state,
          action: PayloadAction<{ promoBars: PromoBar[]; settings: { autoplayDelay: number } }>
        ) => {
          state.loading = false;
          state.promoBars = action.payload.promoBars;
          state.settings = action.payload.settings;
        }
      )
      .addCase(fetchPromoBars.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updatePromoBarSettings.pending, (state) => {
        state.savingSettings = true;
      })
      .addCase(updatePromoBarSettings.fulfilled, (state, action) => {
        state.savingSettings = false;
        state.settings = action.payload;
      })
      .addCase(updatePromoBarSettings.rejected, (state, action) => {
        state.savingSettings = false;
        state.error = action.payload as string;
      })
      .addCase(reorderPromoBars.fulfilled, (state, action) => {
        state.promoBars = action.payload.promoBars;
      })
      .addCase(togglePromoBarActive.fulfilled, (state, action) => {
        const index = state.promoBars.findIndex((bar) => bar.id === action.payload.id);
        if (index !== -1) state.promoBars[index] = action.payload;
      })
      .addCase(deletePromoBar.fulfilled, (state, action) => {
        state.promoBars = state.promoBars.filter((bar) => bar.id !== action.payload);
      });
  },
});

export const { clearError } = promoBarsSlice.actions;
export default promoBarsSlice.reducer;
