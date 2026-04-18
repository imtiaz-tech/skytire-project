import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardState, Analytics } from './types';

const initialState: DashboardState = {
  analytics: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAnalytics: (state, action: PayloadAction<Analytics>) => {
      state.analytics = action.payload;
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setAnalytics, setError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
