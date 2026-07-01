import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  sessionId: string | undefined;
  isLoading: boolean;
  error: string | null;
  addUserMessage: (content: string) => ChatMessage;
  addAssistantMessage: () => ChatMessage;
  updateMessageContent: (messageId: string, content: string) => void;
  appendMessageContent: (messageId: string, content: string) => void;
  setSessionId: (sessionId: string | undefined) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      sessionId: undefined,
      isLoading: false,
      error: null,

      addUserMessage: (content: string) => {
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          timestamp: Date.now(),
        };
        set((state) => ({ messages: [...state.messages, message] }));
        return message;
      },

      addAssistantMessage: () => {
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        };
        set((state) => ({ messages: [...state.messages, message] }));
        return message;
      },

      updateMessageContent: (messageId: string, content: string) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg
          ),
        }));
      },

      appendMessageContent: (messageId: string, content: string) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: msg.content + content } : msg
          ),
        }));
      },

      setSessionId: (sessionId: string | undefined) => {
        set({ sessionId });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearChat: () => {
        set({ messages: [], sessionId: undefined, error: null });
      },
    }),
    {
      name: 'ai-agent-chat-state',
    }
  )
);
