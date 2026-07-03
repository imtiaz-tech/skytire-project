import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { BannerData, BannerState } from '@/redux/types/bannerTypes';
import { DEFAULT_BANNER } from '@/lib/bannerValidation';

const initialState: BannerState = {
  data: DEFAULT_BANNER,
  loading: false,
  saving: false,
  uploading: false,
  error: null,
};

export const fetchBanner = createAsyncThunk(
  'banner/fetchBanner',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/banner');
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch banner'
      );
    }
  }
);

export const saveBanner = createAsyncThunk(
  'banner/saveBanner',
  async (data: BannerData, { rejectWithValue }) => {
    try {
      const response = await axios.put('/api/admin/banner', data);
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to save banner'
      );
    }
  }
);

export const uploadBannerImage = createAsyncThunk(
  'banner/uploadBannerImage',
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await axios.post('/api/admin/banner/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as { backgroundImage: string; imageUrl: string };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to upload image'
      );
    }
  }
);

const bannerSlice = createSlice({
  name: 'banner',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanner.fulfilled, (state, action: PayloadAction<BannerData>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBanner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveBanner.pending, (state) => {
        state.saving = true;
      })
      .addCase(saveBanner.fulfilled, (state, action: PayloadAction<BannerData>) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(saveBanner.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(uploadBannerImage.pending, (state) => {
        state.uploading = true;
      })
      .addCase(
        uploadBannerImage.fulfilled,
        (state, action: PayloadAction<{ backgroundImage: string }>) => {
          state.uploading = false;
          state.data.backgroundImage = action.payload.backgroundImage;
        }
      )
      .addCase(uploadBannerImage.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = bannerSlice.actions;
export default bannerSlice.reducer;
