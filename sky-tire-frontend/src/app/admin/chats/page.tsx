'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  clearSelectedConversation,
  fetchChatConversationById,
  fetchChatConversations,
  fetchUnreadChatCount,
  sendAdminChatReply,
} from '@/features/chats/slice';
import toast from 'react-hot-toast';

function avatarLetter(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export default function ChatsPage() {
  const dispatch = useAppDispatch();
  const {
    conversations,
    selectedConversation,
    messages,
    loading,
    messagesLoading,
    sending,
  } = useAppSelector((state) => state.chats);

  const [reply, setReply] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedId = selectedConversation?.id;

  useEffect(() => {
    dispatch(fetchChatConversations());
    dispatch(fetchUnreadChatCount());

    const interval = setInterval(() => {
      dispatch(fetchChatConversations());
      dispatch(fetchUnreadChatCount());
    }, 15000);

    return () => {
      clearInterval(interval);
      dispatch(clearSelectedConversation());
    };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      dispatch(fetchChatConversationById(selectedId));
    }, 10000);
    return () => clearInterval(interval);
  }, [dispatch, selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelect = async (id: string) => {
    try {
      await dispatch(fetchChatConversationById(id)).unwrap();
      dispatch(fetchUnreadChatCount());
    } catch (error: unknown) {
      toast.error(typeof error === 'string' ? error : 'Failed to load conversation');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !reply.trim() || sending) return;
    const text = reply.trim();
    setReply('');
    try {
      await dispatch(
        sendAdminChatReply({ conversationId: selectedConversation.id, message: text })
      ).unwrap();
    } catch (error: unknown) {
      setReply(text);
      toast.error(typeof error === 'string' ? error : 'Failed to send reply');
    }
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-[520px] gap-4 p-1">
      {/* Users list */}
      <div className="flex w-full max-w-[320px] flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h1 className="text-xl font-bold text-[#1e2a4a]">Users</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#1e2a4a]" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No chats yet</p>
          ) : (
            conversations.map((c) => {
              const isActive = selectedConversation?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-5 py-3.5 text-left transition-colors ${
                    isActive ? 'bg-[#f0f3f9]' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#8B1E2D] text-sm font-semibold text-white">
                    {avatarLetter(c.name)}
                    {!c.isRead && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-[15px] ${
                        c.isRead ? 'font-medium text-gray-600' : 'font-semibold text-[#1e2a4a]'
                      }`}
                    >
                      {c.name}
                    </p>
                    {c.lastMessage && (
                      <p className="truncate text-xs text-gray-400">{c.lastMessage.body}</p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat pane */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {!selectedConversation ? (
          <div className="flex flex-1 items-start justify-center pt-16">
            <p className="text-[15px] text-gray-500">Select a user to view their chat history.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B1E2D] text-sm font-semibold text-white">
                {avatarLetter(selectedConversation.name)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-[#1e2a4a]">{selectedConversation.name}</p>
                <p className="truncate text-xs text-gray-400">
                  {selectedConversation.email} · {selectedConversation.phone}
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-[#f7f8fb] px-5 py-4">
              {messagesLoading && messages.length === 0 ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-[#1e2a4a]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
                  <MessageSquare className="h-8 w-8" />
                  <p className="text-sm">No messages yet</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isAdmin = m.sender === 'ADMIN';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                          isAdmin
                            ? 'rounded-br-md bg-[#1e2a4a] text-white'
                            : 'rounded-bl-md bg-white text-[#1e2a4a] shadow-sm'
                        }`}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3"
            >
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply..."
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-[#1e2a4a] focus:ring-1 focus:ring-[#1e2a4a]/30"
              />
              <button
                type="submit"
                disabled={sending || !reply.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e2a4a] text-white transition hover:bg-[#2a3a5a] disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
