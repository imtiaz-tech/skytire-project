import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'DEFAULT_USER';
  memberId: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async Thunk for Sign Up
export const signupUser = createAsyncThunk(
  'auth/signup',
  async (formData: any, { rejectWithValue }) => {
    try {
      console.log('--- Signup Attempt ---');
      const response = await api.post('/auth/signup', formData);
      console.log("🚀 ~ response:", response)
      return response.data; // { user, token, message }
    } catch (err: any) {
      console.error('Signup API Error Trace:', err);
      return rejectWithValue(err.data?.message || err.message || 'Signup failed.');
    }
  }
);

// Async Thunk for Login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: any, { rejectWithValue }) => {
    try {
      console.log('--- Login Attempt ---');
      const response = await api.post('/auth/login', credentials);
      return response.data; // { user, token, message }
    } catch (err: any) {
      console.error('Login API Error Trace:', err);
      return rejectWithValue(err.data?.message || err.message || 'Login failed.');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    hydrateToken: (state) => {
      if (typeof window !== 'undefined') {
        state.token = localStorage.getItem('token');
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(signupUser.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError, hydrateToken } = authSlice.actions;
export default authSlice.reducer;
