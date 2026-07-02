import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * 聊天消息接口定义
 * @interface ChatMessage
 * @property {string} id - 消息唯一标识符
 * @property {'user' | 'assistant'} role - 消息发送者角色
 * @property {string} content - 消息内容
 * @property {number} timestamp - 消息时间戳
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * 聊天状态管理接口
 * @interface ChatStore
 * @property {ChatMessage[]} messages - 消息列表
 * @property {string | undefined} sessionId - 当前会话ID
 * @property {boolean} isLoading - 加载状态
 * @property {string | null} error - 错误信息
 * @property {(content: string) => ChatMessage} addUserMessage - 添加用户消息
 * @property {() => ChatMessage} addAssistantMessage - 添加助手消息
 * @property {(messageId: string, content: string) => void} updateMessageContent - 更新消息内容
 * @property {(messageId: string, content: string) => void} appendMessageContent - 追加消息内容
 * @property {(sessionId: string | undefined) => void} setSessionId - 设置会话ID
 * @property {(loading: boolean) => void} setLoading - 设置加载状态
 * @property {(error: string | null) => void} setError - 设置错误信息
 * @property {() => void} clearChat - 清空聊天记录
 */
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

/**
 * 聊天状态管理Store
 * 使用 Zustand 配合 persist 中间件实现状态持久化
 * @returns {ChatStore} 聊天状态管理对象
 */
export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      sessionId: undefined,
      isLoading: false,
      error: null,

      /**
       * 添加用户消息
       * @param {string} content - 用户输入的消息内容
       * @returns {ChatMessage} 创建的消息对象
       */
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

      /**
       * 添加助手消息
       * 创建一个空内容的助手消息，用于后续流式响应填充
       * @returns {ChatMessage} 创建的消息对象
       */
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

      /**
       * 更新指定消息的内容
       * @param {string} messageId - 消息ID
       * @param {string} content - 新的消息内容
       */
      updateMessageContent: (messageId: string, content: string) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content } : msg
          ),
        }));
      },

      /**
       * 追加消息内容
       * 用于流式响应场景，逐步拼接内容
       * @param {string} messageId - 消息ID
       * @param {string} content - 要追加的内容
       */
      appendMessageContent: (messageId: string, content: string) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, content: msg.content + content } : msg
          ),
        }));
      },

      /**
       * 设置当前会话ID
       * @param {string | undefined} sessionId - 会话ID
       */
      setSessionId: (sessionId: string | undefined) => {
        set({ sessionId });
      },

      /**
       * 设置加载状态
       * @param {boolean} loading - 是否正在加载
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * 设置错误信息
       * @param {string | null} error - 错误信息
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * 清空聊天记录
       * 重置消息列表、会话ID和错误信息
       */
      clearChat: () => {
        set({ messages: [], sessionId: undefined, error: null });
      },
    }),
    {
      name: 'ai-agent-chat-state',
    }
  )
);