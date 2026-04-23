import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { User, UsersState } from '../types/userTypes';

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
};

// Fetch Users with pagination and search
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page, limit, search }: { page: number; limit: number; search: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
      return response.data; // Expected: { users: User[], total: number, pages: number }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch users');
    }
  }
);

// Toggle User Active Status
export const toggleUserStatus = createAsyncThunk(
  'users/toggleStatus',
  async ({ id, isActive }: { id: number; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/users/${id}/status`, { isActive });
      return { id, isActive, message: response.data.message };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update user status');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<{ users: User[]; total: number; pages: number }>) => {
        state.loading = false;
        state.users = action.payload.users;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
      })
      .addCase(fetchUsers.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Toggle User Status
      .addCase(toggleUserStatus.pending, (state) => {
        // We could add a local loading state for specific users if needed, 
        // but for now we follow the general loading pattern or keep it silent for better UX
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action: PayloadAction<{ id: number; isActive: boolean }>) => {
        const user = state.users.find(u => u.id === action.payload.id);
        if (user) {
          user.isActive = action.payload.isActive;
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
