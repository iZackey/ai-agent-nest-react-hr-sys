import { useCallback, useRef } from 'react';
import { streamQuery } from '../api/client';
import { useChatStore } from '../stores/chatStore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function useChat() {
  const messages = useChatStore((state) => state.messages);
  const sessionId = useChatStore((state) => state.sessionId);
  const isLoading = useChatStore((state) => state.isLoading);
  const error = useChatStore((state) => state.error);

  const addUserMessage = useChatStore((state) => state.addUserMessage);
  const addAssistantMessage = useChatStore((state) => state.addAssistantMessage);
  const appendMessageContent = useChatStore((state) => state.appendMessageContent);
  const updateMessageContent = useChatStore((state) => state.updateMessageContent);
  const setSessionId = useChatStore((state) => state.setSessionId);
  const setLoading = useChatStore((state) => state.setLoading);
  const setError = useChatStore((state) => state.setError);
  const clearChat = useChatStore((state) => state.clearChat);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      abortRef.current?.abort();

      addUserMessage(question);
      const assistantMsg = addAssistantMessage();

      setLoading(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const chunk of streamQuery(question, sessionId, controller.signal)) {
          if (chunk.text) {
            appendMessageContent(assistantMsg.id, chunk.text);
          }
          if (chunk.sessionId) {
            setSessionId(chunk.sessionId);
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          updateMessageContent(assistantMsg.id, '已取消');
        } else {
          const msg = err instanceof Error ? err.message : '未知错误';
          setError(msg);
          updateMessageContent(assistantMsg.id, `❌ ${msg}`);
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [sessionId, addUserMessage, addAssistantMessage, appendMessageContent, updateMessageContent, setSessionId, setLoading, setError]
  );

  const stopMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, sessionId, isLoading, error, sendMessage, stopMessage, clearChat };
}
