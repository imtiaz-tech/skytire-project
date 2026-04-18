import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccessoryState } from './types';

const initialState: AccessoryState = {
  items: [],
  loading: false,
  error: null,
};

const accessorySlice = createSlice({
  name: 'accessories',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setAccessories: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setAccessories, setError } = accessorySlice.actions;
export default accessorySlice.reducer;
