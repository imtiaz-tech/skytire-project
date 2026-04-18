import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WireWheelState } from './types';

const initialState: WireWheelState = {
  items: [],
  loading: false,
  error: null,
};

const wireWheelSlice = createSlice({
  name: 'wireWheels',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setWireWheels: (state, action: PayloadAction<any[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setLoading, setWireWheels, setError } = wireWheelSlice.actions;
export default wireWheelSlice.reducer;
