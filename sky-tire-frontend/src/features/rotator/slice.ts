import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  RotatorAnimation,
  RotatorColors,
  RotatorHeadline,
  RotatorHeadlineFormData,
  RotatorState,
} from '@/redux/types/rotatorTypes';
import {
  DEFAULT_ROTATOR_ANIMATION,
  DEFAULT_ROTATOR_COLORS,
} from '@/lib/rotatorValidation';

const initialState: RotatorState = {
  colors: { ...DEFAULT_ROTATOR_COLORS },
  animation: { ...DEFAULT_ROTATOR_ANIMATION },
  headlines: [],
  loading: false,
  savingColors: false,
  savingAnimation: false,
  error: null,
};

export const fetchRotator = createAsyncThunk(
  'rotator/fetchRotator',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/rotator');
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch rotator'
      );
    }
  }
);

export const updateRotatorColors = createAsyncThunk(
  'rotator/updateRotatorColors',
  async (colors: RotatorColors, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/rotator/colors', colors);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to save colors'
      );
    }
  }
);

export const updateRotatorAnimation = createAsyncThunk(
  'rotator/updateRotatorAnimation',
  async (animation: RotatorAnimation, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/rotator/animation', animation);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to save animation'
      );
    }
  }
);

export const createRotatorHeadline = createAsyncThunk(
  'rotator/createRotatorHeadline',
  async (data: RotatorHeadlineFormData, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/rotator/headlines', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to create headline'
      );
    }
  }
);

export const updateRotatorHeadline = createAsyncThunk(
  'rotator/updateRotatorHeadline',
  async ({ id, data }: { id: string; data: RotatorHeadlineFormData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/rotator/headlines/${id}`, data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update headline'
      );
    }
  }
);

export const deleteRotatorHeadline = createAsyncThunk(
  'rotator/deleteRotatorHeadline',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/rotator/headlines/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to delete headline'
      );
    }
  }
);

export const reorderRotatorHeadlines = createAsyncThunk(
  'rotator/reorderRotatorHeadlines',
  async (ids: string[], { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/rotator/headlines/reorder', { ids });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to reorder headlines'
      );
    }
  }
);

export const toggleRotatorHeadlineActive = createAsyncThunk(
  'rotator/toggleRotatorHeadlineActive',
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/admin/rotator/headlines/${id}`, { isActive });
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update headline status'
      );
    }
  }
);

const rotatorSlice = createSlice({
  name: 'rotator',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRotator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchRotator.fulfilled,
        (
          state,
          action: PayloadAction<{
            colors: RotatorColors;
            animation: RotatorAnimation;
            headlines: RotatorHeadline[];
          }>
        ) => {
          state.loading = false;
          state.colors = action.payload.colors;
          state.animation = action.payload.animation;
          state.headlines = action.payload.headlines;
        }
      )
      .addCase(fetchRotator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateRotatorColors.pending, (state) => {
        state.savingColors = true;
      })
      .addCase(updateRotatorColors.fulfilled, (state, action) => {
        state.savingColors = false;
        state.colors = action.payload;
      })
      .addCase(updateRotatorColors.rejected, (state, action) => {
        state.savingColors = false;
        state.error = action.payload as string;
      })
      .addCase(updateRotatorAnimation.pending, (state) => {
        state.savingAnimation = true;
      })
      .addCase(updateRotatorAnimation.fulfilled, (state, action) => {
        state.savingAnimation = false;
        state.animation = action.payload;
      })
      .addCase(updateRotatorAnimation.rejected, (state, action) => {
        state.savingAnimation = false;
        state.error = action.payload as string;
      })
      .addCase(reorderRotatorHeadlines.fulfilled, (state, action) => {
        state.headlines = action.payload.headlines;
      })
      .addCase(toggleRotatorHeadlineActive.fulfilled, (state, action) => {
        const index = state.headlines.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) state.headlines[index] = action.payload;
      })
      .addCase(deleteRotatorHeadline.fulfilled, (state, action) => {
        state.headlines = state.headlines.filter((h) => h.id !== action.payload);
      });
  },
});

export const { clearError } = rotatorSlice.actions;
export default rotatorSlice.reducer;
