import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { TiresState, Tire } from '../types/tireTypes';

const initialState: TiresState = {
  tires: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
};

export const fetchTires = createAsyncThunk(
  'tires/fetchTires',
  async ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string }) => {
    const response = await axios.get(`/api/admin/tires?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  }
);

export const createTire = createAsyncThunk(
  'tires/createTire',
  async (data: any) => {
    const response = await axios.post('/api/admin/tires', data);
    return response.data;
  }
);

export const updateTire = createAsyncThunk(
  'tires/updateTire',
  async ({ id, data }: { id: string; data: any }) => {
    const response = await axios.put(`/api/admin/tires/${id}`, data);
    return response.data;
  }
);

export const deleteTire = createAsyncThunk(
  'tires/deleteTire',
  async (id: string) => {
    await axios.delete(`/api/admin/tires/${id}`);
    return id;
  }
);

const tiresSlice = createSlice({
  name: 'tires',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTires.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTires.fulfilled, (state, action) => {
        state.loading = false;
        state.tires = action.payload.tires;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.currentPage = action.payload.currentPage;
      })
      .addCase(fetchTires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tires';
      })
      .addCase(createTire.fulfilled, (state, action) => {
        state.tires.unshift(action.payload);
      })
      .addCase(updateTire.fulfilled, (state, action) => {
        const index = state.tires.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tires[index] = action.payload;
        }
      })
      .addCase(deleteTire.fulfilled, (state, action) => {
        state.tires = state.tires.filter((t) => t.id !== action.payload);
      });
  },
});

export default tiresSlice.reducer;
