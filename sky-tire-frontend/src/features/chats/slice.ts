import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  ChatConversation,
  ChatMessage,
  ChatsState,
} from '@/redux/types/chatTypes';

const initialState: ChatsState = {
  conversations: [],
  selectedConversation: null,
  messages: [],
  loading: false,
  messagesLoading: false,
  sending: false,
  error: null,
  unreadCount: 0,
};

export const fetchUnreadChatCount = createAsyncThunk(
  'chats/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/api/admin/chats/unread-count');
      return response.data.count as number;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch unread chat count'
      );
    }
  }
);

export const fetchChatConversations = createAsyncThunk(
  'chats/fetchConversations',
  async (search: string | undefined, { rejectWithValue }) => {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await axios.get(`/api/admin/chats${q}`);
      return response.data.conversations as ChatConversation[];
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch conversations'
      );
    }
  }
);

export const fetchChatConversationById = createAsyncThunk(
  'chats/fetchConversationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/admin/chats/${id}`);
      return response.data as {
        conversation: ChatConversation & { wasUnread?: boolean };
        messages: ChatMessage[];
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to fetch conversation'
      );
    }
  }
);

export const sendAdminChatReply = createAsyncThunk(
  'chats/sendAdminReply',
  async (
    { conversationId, message }: { conversationId: string; message: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.post(`/api/admin/chats/${conversationId}`, { message });
      return response.data as ChatMessage;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      return rejectWithValue(
        error.response?.data?.error || error.message || 'Failed to send reply'
      );
    }
  }
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
      state.messages = [];
    },
    clearChatError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadChatCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(fetchChatConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchChatConversations.fulfilled,
        (state, action: PayloadAction<ChatConversation[]>) => {
          state.loading = false;
          state.conversations = action.payload;
        }
      )
      .addCase(fetchChatConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchChatConversationById.pending, (state) => {
        state.messagesLoading = true;
        state.error = null;
      })
      .addCase(fetchChatConversationById.fulfilled, (state, action) => {
        state.messagesLoading = false;
        const { conversation, messages } = action.payload;
        state.selectedConversation = conversation;
        state.messages = messages;

        const existing = state.conversations.find((c) => c.id === conversation.id);
        if (existing && !existing.isRead) {
          existing.isRead = true;
          if (conversation.wasUnread) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      .addCase(fetchChatConversationById.rejected, (state, action) => {
        state.messagesLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendAdminChatReply.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendAdminChatReply.fulfilled, (state, action) => {
        state.sending = false;
        state.messages.push(action.payload);
        const conv = state.conversations.find((c) => c.id === action.payload.conversationId);
        if (conv) {
          conv.lastMessage = action.payload;
          conv.updatedAt = action.payload.createdAt;
          conv.isRead = true;
        }
      })
      .addCase(sendAdminChatReply.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSelectedConversation, clearChatError } = chatsSlice.actions;
export default chatsSlice.reducer;
