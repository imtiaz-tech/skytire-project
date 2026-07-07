import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { EmailTemplate, EmailTemplatesState } from '@/redux/types/emailTemplateTypes';

const initialState: EmailTemplatesState = {
  templates: [],
  selectedTemplate: null,
  loading: false,
  saving: false,
  sending: false,
  error: null,
};

export const fetchEmailTemplates = createAsyncThunk(
  'emailTemplates/fetchEmailTemplates',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/email-templates');
      return response.data.templates as EmailTemplate[];
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch email templates'
      );
    }
  }
);

export const fetchEmailTemplateById = createAsyncThunk(
  'emailTemplates/fetchEmailTemplateById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/admin/email-templates/${id}`);
      return response.data as EmailTemplate;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch email template'
      );
    }
  }
);

export const createEmailTemplate = createAsyncThunk(
  'emailTemplates/createEmailTemplate',
  async (data: Record<string, unknown>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/admin/email-templates', data);
      return response.data as EmailTemplate;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to create email template'
      );
    }
  }
);

export const updateEmailTemplate = createAsyncThunk(
  'emailTemplates/updateEmailTemplate',
  async ({ id, data }: { id: string; data: Record<string, unknown> }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/api/admin/email-templates/${id}`, data);
      return response.data as EmailTemplate;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to update email template'
      );
    }
  }
);

export const deleteEmailTemplate = createAsyncThunk(
  'emailTemplates/deleteEmailTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/admin/email-templates/${id}`);
      return id;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to delete email template'
      );
    }
  }
);

export const duplicateEmailTemplate = createAsyncThunk(
  'emailTemplates/duplicateEmailTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/admin/email-templates/${id}/duplicate`);
      return response.data as EmailTemplate;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to duplicate email template'
      );
    }
  }
);

export const sendEmailTemplate = createAsyncThunk(
  'emailTemplates/sendEmailTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.post(`/api/admin/email-templates/${id}/send`);
      return response.data as { message: string; sent: number; failed: number };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to send email template'
      );
    }
  }
);

const emailTemplatesSlice = createSlice({
  name: 'emailTemplates',
  initialState,
  reducers: {
    clearSelectedTemplate: (state) => {
      state.selectedTemplate = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmailTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplates.fulfilled, (state, action: PayloadAction<EmailTemplate[]>) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchEmailTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEmailTemplateById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmailTemplateById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedTemplate = action.payload;
      })
      .addCase(fetchEmailTemplateById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createEmailTemplate.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createEmailTemplate.fulfilled, (state, action) => {
        state.saving = false;
        state.templates.unshift(action.payload);
      })
      .addCase(createEmailTemplate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(updateEmailTemplate.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateEmailTemplate.fulfilled, (state, action) => {
        state.saving = false;
        state.templates = state.templates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        );
        state.selectedTemplate = action.payload;
      })
      .addCase(updateEmailTemplate.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(deleteEmailTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter((t) => t.id !== action.payload);
      })
      .addCase(duplicateEmailTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(sendEmailTemplate.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendEmailTemplate.fulfilled, (state) => {
        state.sending = false;
      })
      .addCase(sendEmailTemplate.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedTemplate, clearError } = emailTemplatesSlice.actions;
export default emailTemplatesSlice.reducer;
