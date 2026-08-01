'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { ArrowUpRight, ChevronDown, Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';
import { ChatMessage } from '@/redux/types/chatTypes';

const STORAGE_KEY = 'skytire_chat_conversation';
const CHAT_BLUE = '#0d2b5c';
const CHAT_BLUE_MID = '#1a4f9c';
const TOPIC_OPTIONS = ['Shipping', 'Tracking', 'Support', 'Other'] as const;
const WELCOME_MESSAGES = [
  "Please let us know if there's anything you need before you leave. Have you found what you were looking for?",
  'What can we help you with today?',
] as const;

type Phase = 'form' | 'topics' | 'chat';

type StoredSession = {
  conversationId: string;
  name: string;
  email: string;
  phone: string;
};

function ChatAvatar() {
  return (
    <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0a1f45] ring-2 ring-white/20">
      <svg viewBox="0 0 40 40" className="h-7 w-7" aria-hidden>
        <circle cx="20" cy="20" r="14" fill="#1a3a6b" />
        <circle cx="20" cy="20" r="9" fill="#0d2b5c" stroke="#4da3ff" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="3.5" fill="#4da3ff" />
        <path
          d="M8 28 Q20 10 32 28"
          stroke="#4da3ff"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ChatWidget() {
  const pathname = usePathname();
  const hide = pathname?.startsWith('/admin');

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesCutoff, setMessagesCutoff] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const persistSession = useCallback((session: StoredSession) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      /* ignore */
    }
  }, []);

  const clearSession = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const loadMessages = useCallback(async (id: string, cutoff?: string | null) => {
    const res = await axios.get(`/api/chat/messages?conversationId=${encodeURIComponent(id)}`);
    let list = (res.data.messages || []) as ChatMessage[];
    const activeCutoff = cutoff === undefined ? messagesCutoff : cutoff;
    if (activeCutoff) {
      list = list.filter((m) => m.createdAt >= activeCutoff);
    }
    setMessages(list);
    if (res.data.conversation) {
      setName(res.data.conversation.name);
      setEmail(res.data.conversation.email);
      setPhone(res.data.conversation.phone);
    }
  }, [messagesCutoff]);

  useEffect(() => {
    if (hide) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredSession;
      if (parsed?.conversationId) {
        setConversationId(parsed.conversationId);
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone || '');
        setPhase('chat');
        loadMessages(parsed.conversationId).catch(() => {
          clearSession();
          setPhase('form');
          setConversationId(null);
        });
      }
    } catch {
      clearSession();
    }
  }, [hide, loadMessages, clearSession]);

  useEffect(() => {
    if (!open || phase !== 'chat' || !conversationId) return;
    const interval = setInterval(() => {
      loadMessages(conversationId).catch(() => undefined);
    }, 8000);
    return () => clearInterval(interval);
  }, [open, phase, conversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, phase]);

  if (hide) return null;

  const openChat = () => setOpen(true);
  const closeChat = () => setOpen(false);

  const handleStartOver = () => {
    const cutoff = new Date().toISOString();
    setDraft('');
    setError(null);
    setMessages([]);
    setMessagesCutoff(cutoff);
    setPhase('topics');
  };

  const handleSelectTopic = async (topic: string) => {
    setError(null);
    const text = topic.trim();
    if (!text || sending || submitting) return;

    // Prefer continuing the existing conversation; fall back to creating one with saved contact info
    if (conversationId) {
      setSending(true);
      try {
        const res = await axios.post('/api/chat/messages', {
          conversationId,
          message: text,
        });
        setMessages((prev) => [...prev, res.data]);
        setPhase('chat');
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { error?: string } } };
        setError(ax.response?.data?.error || 'Failed to send message');
      } finally {
        setSending(false);
      }
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedEmail || !isValidEmail(trimmedEmail) || !trimmedPhone) {
      setPhase('form');
      setError('Please enter your contact details to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post('/api/chat', {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        message: text,
      });
      const id = res.data.conversation.id as string;
      setConversationId(id);
      setMessages(res.data.messages || []);
      setPhase('chat');
      persistSession({
        conversationId: id,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const message = draft.trim();

    if (!trimmedName) {
      setError('Please enter your name');
      return;
    }
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email');
      return;
    }
    if (!trimmedPhone) {
      setError('Please enter your phone number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axios.post('/api/chat', {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        message: message || undefined,
        conversationId: conversationId || undefined,
      });
      const id = res.data.conversation.id as string;
      setConversationId(id);
      setMessages(res.data.messages || []);
      setDraft('');
      setPhase('chat');
      persistSession({
        conversationId: id,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;

    if (phase === 'form') {
      await handleSubmitContact(e);
      return;
    }

    if (phase === 'topics') {
      await handleSelectTopic(text);
      return;
    }

    if (!conversationId) return;
    setSending(true);
    setError(null);
    try {
      const res = await axios.post('/api/chat/messages', {
        conversationId,
        message: text,
      });
      setMessages((prev) => [...prev, res.data]);
      setDraft('');
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { error?: string } } };
      setError(ax.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const chatgptUrl =
    'https://chatgpt.com/?q=' +
    encodeURIComponent('Tell me about Sky Tire (skytire.com) tires and wheels.');

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-28 right-4 z-[90] flex h-[min(520px,68vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-t-2xl rounded-b-xl bg-white shadow-2xl shadow-black/25 sm:bottom-32 sm:right-6">
          <div
            className="flex items-center gap-3 px-4 py-3 text-white"
            style={{ backgroundColor: CHAT_BLUE }}
          >
            <ChatAvatar />
            <p className="flex-1 text-[15px] font-semibold">Hi there 👋</p>
            <button
              type="button"
              onClick={closeChat}
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Minimize chat"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {phase !== 'form' && (
            <div
              className="px-4 py-2 text-center text-[12.5px] font-medium text-white"
              style={{ backgroundColor: CHAT_BLUE_MID }}
            >
              We typically reply within a few minutes.
            </div>
          )}

          {phase === 'form' ? (
            <form
              onSubmit={handleSubmitContact}
              className="flex flex-1 flex-col overflow-y-auto px-5 py-4"
            >
              <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mb-4 border-0 border-b border-gray-300 bg-transparent py-2 text-sm text-black outline-none placeholder:text-gray-400 focus:border-[#0d2b5c]"
              />
              <input
                type="email"
                placeholder="Enter Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mb-4 border-0 border-b border-gray-300 bg-transparent py-2 text-sm text-black outline-none placeholder:text-gray-400 focus:border-[#0d2b5c]"
              />
              <input
                type="tel"
                placeholder="Enter Phone No"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mb-5 border-0 border-b border-gray-300 bg-transparent py-2 text-sm text-black outline-none placeholder:text-gray-400 focus:border-[#0d2b5c]"
              />
              {error && <p className="mb-3 text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: CHAT_BLUE }}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </span>
                ) : (
                  'Submit'
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden bg-[#f7f8fb]">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {WELCOME_MESSAGES.map((text) => (
                  <div key={text} className="flex justify-start">
                    <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-[#eceff3] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#2a2f3a]">
                      {text}
                    </div>
                  </div>
                ))}

                {/* Hide prior thread while choosing a topic (Start Over view) */}
                {phase !== 'topics' &&
                  messages.map((m) => {
                    const isVisitor = m.sender === 'VISITOR';
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                            isVisitor
                              ? 'rounded-br-md text-white'
                              : 'rounded-bl-md bg-[#eceff3] text-[#2a2f3a]'
                          }`}
                          style={
                            isVisitor
                              ? { backgroundColor: CHAT_BLUE }
                              : undefined
                          }
                        >
                          {m.body}
                        </div>
                      </div>
                    );
                  })}

                {phase === 'topics' ? (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {TOPIC_OPTIONS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        disabled={sending || submitting}
                        onClick={() => handleSelectTopic(topic)}
                        className="rounded-xl border-2 bg-white px-3 py-3 text-sm font-bold transition hover:bg-[#f0f5ff] disabled:opacity-50"
                        style={{ borderColor: CHAT_BLUE, color: CHAT_BLUE }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-xs font-semibold transition hover:bg-[#f0f5ff]"
                      style={{ borderColor: CHAT_BLUE, color: CHAT_BLUE }}
                    >
                      Start Over
                      <span
                        className="flex h-4 w-4 items-center justify-center rounded-sm text-white"
                        style={{ backgroundColor: CHAT_BLUE }}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </button>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {error && <p className="px-4 pb-1 text-xs text-red-500">{error}</p>}
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask your query..."
              className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-black outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#0d2b5c]/40"
            />
            <button
              type="submit"
              disabled={sending || submitting || !draft.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#2f6fed' }}
              aria-label="Send message"
            >
              {sending || submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* Launchers — sit below the chat panel */}
      <div className="fixed bottom-5 right-4 z-[90] flex flex-col items-end gap-2.5 sm:right-6">
        <a
          href={chatgptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-full border border-gray-100 bg-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-black/15 transition hover:shadow-xl"
          style={{ color: CHAT_BLUE }}
        >
          <Sparkles className="h-4 w-4 text-[#10A37F]" />
          Ask ChatGPT about us
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openChat}
            className="rounded-full border bg-white px-4 py-2.5 text-sm font-bold shadow-lg shadow-black/15 transition hover:shadow-xl"
            style={{ borderColor: CHAT_BLUE, color: CHAT_BLUE }}
          >
            Chat with Us 👋
          </button>
          <button
            type="button"
            onClick={() => (open ? closeChat() : openChat())}
            className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl shadow-black/25 transition hover:scale-105"
            style={{ backgroundColor: CHAT_BLUE }}
            aria-label={open ? 'Close chat' : 'Open chat'}
          >
            <MessageCircle className="h-6 w-6" fill="currentColor" />
          </button>
        </div>
      </div>
    </>
  );
}
