import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WheelState } from './types';

const initialState: WheelState = {
  items: [],
  loading: false,
  error: null,
};

const wheelSlice = createSlice({
  name: 'wheels',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setWheels: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setWheels, setError } = wheelSlice.actions;
export default wheelSlice.reducer;
