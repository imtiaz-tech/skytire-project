export type ChatSender = 'VISITOR' | 'ADMIN';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: ChatSender;
  body: string;
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  name: string;
  email: string;
  phone: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
  lastMessage?: ChatMessage | null;
}

export interface ChatsState {
  conversations: ChatConversation[];
  selectedConversation: ChatConversation | null;
  messages: ChatMessage[];
  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  error: string | null;
  unreadCount: number;
}
