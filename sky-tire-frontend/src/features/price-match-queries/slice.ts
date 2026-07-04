import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  PriceMatchQuery,
  PriceMatchQueriesState,
} from '@/redux/types/priceMatchQueryTypes';

const initialState: PriceMatchQueriesState = {
  queries: [],
  selectedQuery: null,
  loading: false,
  detailLoading: false,
  error: null,
  total: 0,
  pages: 0,
  currentPage: 1,
  unreadCount: 0,
};

export const fetchUnreadPriceMatchCount = createAsyncThunk(
  'priceMatchQueries/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/price-match-queries/unread-count');
      return response.data.count as number;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch unread count'
      );
    }
  }
);

export const markPriceMatchQueryRead = createAsyncThunk(
  'priceMatchQueries/markRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/api/admin/price-match-queries/${id}`);
      return response.data as { id: string; isRead: boolean; wasUnread: boolean };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to mark query as read'
      );
    }
  }
);

export const markAllPriceMatchQueriesRead = createAsyncThunk(
  'priceMatchQueries/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await axios.post('/api/admin/price-match-queries/mark-read');
      return 0;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to mark queries as read'
      );
    }
  }
);

export const fetchPriceMatchQueries = createAsyncThunk(
  'priceMatchQueries/fetchPriceMatchQueries',
  async (
    params: { page: number; limit: number; search: string; sortBy?: string; sortOrder?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const search = params?.search || '';
      const sortBy = params?.sortBy || 'createdAt';
      const sortOrder = params?.sortOrder || 'desc';
      const response = await axios.get(
        `/api/admin/price-match-queries?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      return response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch price match queries'
      );
    }
  }
);

export const fetchPriceMatchQueryById = createAsyncThunk(
  'priceMatchQueries/fetchPriceMatchQueryById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/admin/price-match-queries/${id}`);
      return response.data as PriceMatchQuery;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch price match query'
      );
    }
  }
);

const priceMatchQueriesSlice = createSlice({
  name: 'priceMatchQueries',
  initialState,
  reducers: {
    clearSelectedQuery: (state) => {
      state.selectedQuery = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceMatchQueries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPriceMatchQueries.fulfilled,
        (
          state,
          action: PayloadAction<{
            queries: PriceMatchQuery[];
            total: number;
            pages: number;
            currentPage: number;
          }>
        ) => {
          state.loading = false;
          state.queries = action.payload.queries;
          state.total = action.payload.total;
          state.pages = action.payload.pages;
          state.currentPage = action.payload.currentPage;
        }
      )
      .addCase(fetchPriceMatchQueries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchPriceMatchQueryById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchPriceMatchQueryById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedQuery = action.payload;
      })
      .addCase(fetchPriceMatchQueryById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUnreadPriceMatchCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markPriceMatchQueryRead.fulfilled, (state, action) => {
        const { id, wasUnread } = action.payload;
        const query = state.queries.find((q) => q.id === id);
        if (query) {
          query.isRead = true;
        }
        if (state.selectedQuery?.id === id) {
          state.selectedQuery.isRead = true;
        }
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllPriceMatchQueriesRead.fulfilled, (state) => {
        state.unreadCount = 0;
        state.queries.forEach((q) => {
          q.isRead = true;
        });
      });
  },
});

export const { clearSelectedQuery, clearError } = priceMatchQueriesSlice.actions;
export default priceMatchQueriesSlice.reducer;
