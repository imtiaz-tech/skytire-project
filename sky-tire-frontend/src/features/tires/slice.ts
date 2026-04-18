import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TireState } from './types';

const initialState: TireState = {
  items: [],
  loading: false,
  error: null,
};

const tireSlice = createSlice({
  name: 'tires',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setTires: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setTires, setError } = tireSlice.actions;
export default tireSlice.reducer;
