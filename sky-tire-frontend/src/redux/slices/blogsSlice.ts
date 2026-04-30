import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/lib/api';
import { Blog } from '../types/blogTypes';

interface BlogsState {
  blogs: Blog[];
  loading: boolean;
  error: string | null;
}

const initialState: BlogsState = {
  blogs: [],
  loading: false,
  error: null,
};

export const fetchBlogs = createAsyncThunk('blogs/fetchAll', async (status?: string) => {
  const url = status ? `/blogs?status=${status}` : '/blogs';
  const response = await apiClient.get(url);
  return response.data;
});

export const fetchBlogById = createAsyncThunk('blogs/fetchById', async (id: string) => {
  const response = await apiClient.get(`/blogs/${id}`);
  return response.data;
});

export const createBlog = createAsyncThunk('blogs/create', async (data: FormData) => {
  const response = await apiClient.post('/blogs', data);
  return response.data;
});

export const updateBlog = createAsyncThunk('blogs/update', async ({ id, formData }: { id: string; formData: FormData }) => {
  const response = await apiClient.patch(`/blogs/${id}`, formData);
  return response.data;
});

export const deleteBlog = createAsyncThunk('blogs/delete', async (id: string) => {
  await apiClient.delete(`/blogs/${id}`);
  return id;
});

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogs.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchBlogs.fulfilled, (state, action) => { state.loading = false; state.blogs = action.payload; })
      .addCase(fetchBlogs.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed'; })
      .addCase(createBlog.fulfilled, (state, action) => { state.blogs.unshift(action.payload); })
      .addCase(updateBlog.fulfilled, (state, action) => {
        const index = state.blogs.findIndex(b => b.id === action.payload.id);
        if (index !== -1) state.blogs[index] = action.payload;
      })
      .addCase(deleteBlog.fulfilled, (state, action) => {
        state.blogs = state.blogs.filter(b => b.id !== action.payload);
      });
  },
});

export default blogsSlice.reducer;
