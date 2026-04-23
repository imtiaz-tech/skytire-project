import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api';
import { User, UsersState, Device } from '../types/userTypes';

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
  total: 0,
  pages: 0,
  devicesByUserId: {},
  deviceLoading: false,
};

// ─── Fetch Users ──────────────────────────────────────────────────────────────
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ page, limit, search }: { page: number; limit: number; search: string }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch users');
    }
  }
);

// ─── Toggle User Active Status ────────────────────────────────────────────────
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

// ─── Toggle Device Ban for all devices of a user ──────────────────────────────
export const toggleDeviceBan = createAsyncThunk(
  'users/toggleDeviceBan',
  async ({ id, ban }: { id: number; ban: boolean }, { rejectWithValue }) => {
    try {
      await api.patch(`/admin/users/${id}/devices/ban`, { ban });
      return { id, ban };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to update device ban');
    }
  }
);

// ─── Fetch Device History for a user ─────────────────────────────────────────
export const fetchUserDevices = createAsyncThunk(
  'users/fetchUserDevices',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/users/${userId}/devices`);
      return { userId, devices: response.data as Device[] };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || err.message || 'Failed to fetch devices');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearDevices: (state, action: PayloadAction<number>) => {
      delete state.devicesByUserId[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // ── fetchUsers ──────────────────────────────────────────────────────────
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

      // ── toggleUserStatus ────────────────────────────────────────────────────
      .addCase(toggleUserStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action: PayloadAction<{ id: number; isActive: boolean }>) => {
        const user = state.users.find(u => u.id === action.payload.id);
        if (user) {
          user.isActive = action.payload.isActive;
          // When deactivating, the backend bans all devices → reflect locally
          if (!action.payload.isActive) {
            user.allDevicesBanned = true;
          }
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
      })

      // ── toggleDeviceBan ─────────────────────────────────────────────────────
      .addCase(toggleDeviceBan.fulfilled, (state, action: PayloadAction<{ id: number; ban: boolean }>) => {
        const user = state.users.find(u => u.id === action.payload.id);
        if (user) {
          user.allDevicesBanned = action.payload.ban;
        }
        // Invalidate cached device list so re-open shows fresh data
        delete state.devicesByUserId[action.payload.id];
      })
      .addCase(toggleDeviceBan.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
      })

      // ── fetchUserDevices ────────────────────────────────────────────────────
      .addCase(fetchUserDevices.pending, (state) => {
        state.deviceLoading = true;
      })
      .addCase(fetchUserDevices.fulfilled, (state, action: PayloadAction<{ userId: number; devices: Device[] }>) => {
        state.deviceLoading = false;
        state.devicesByUserId[action.payload.userId] = action.payload.devices;
      })
      .addCase(fetchUserDevices.rejected, (state, action: PayloadAction<any>) => {
        state.deviceLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearDevices } = usersSlice.actions;
export default usersSlice.reducer;
