import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api';
import { BlogCategory } from '../types/blogTypes';

interface BlogCategoriesState {
  categories: BlogCategory[];
  loading: boolean;
  error: string | null;
}

const initialState: BlogCategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchBlogCategories = createAsyncThunk('blogCategories/fetchAll', async () => {
  const response = await apiClient.get('/blog-categories');
  return response.data;
});

export const createBlogCategory = createAsyncThunk('blogCategories/create', async (data: Partial<BlogCategory>) => {
  const response = await apiClient.post('/blog-categories', data);
  return response.data;
});

export const updateBlogCategory = createAsyncThunk('blogCategories/update', async ({ id, data }: { id: string; data: Partial<BlogCategory> }) => {
  const response = await apiClient.patch(`/blog-categories/${id}`, data);
  return response.data;
});

export const deleteBlogCategory = createAsyncThunk('blogCategories/delete', async (id: string) => {
  await apiClient.delete(`/blog-categories/${id}`);
  return id;
});

const blogCategoriesSlice = createSlice({
  name: 'blogCategories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogCategories.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBlogCategories.fulfilled, (state, action) => { state.loading = false; state.categories = action.payload; })
      .addCase(fetchBlogCategories.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      .addCase(createBlogCategory.fulfilled, (state, action) => { state.categories.unshift(action.payload); })
      .addCase(updateBlogCategory.fulfilled, (state, action) => {
        const index = state.categories.findIndex(c => c.id === action.payload.id);
        if (index !== -1) state.categories[index] = action.payload;
      })
      .addCase(deleteBlogCategory.fulfilled, (state, action) => {
        state.categories = state.categories.filter(c => c.id !== action.payload);
      });
  },
});

export default blogCategoriesSlice.reducer;
