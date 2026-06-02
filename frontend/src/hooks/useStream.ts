import { useState, useCallback, useRef } from 'react';
import { streamQuery } from '../api/client';

export function useStream() {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (prompt: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    setText('');
    setIsStreaming(true);

    try {
      for await (const chunk of streamQuery(prompt, controller.signal)) {
        setText((prev) => prev + chunk);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 用户主动取消
      } else {
        setText((prev) => prev + `\n\n❌ ${err instanceof Error ? err.message : '流式请求失败'}`);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetStream = useCallback(() => {
    abortRef.current?.abort();
    setText('');
    setIsStreaming(false);
  }, []);

  return { text, isStreaming, startStream, stopStream, resetStream };
}
