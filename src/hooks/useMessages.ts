import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages, sendMessage as sendMessageRequest } from "@/api/client";
import { cacheMessages, getCachedMessages } from "@/lib/offlineCache";
import type { ChatMessage } from "@/types";

interface UseMessagesOptions {
  sessionId: string | null;
  isOnline: boolean;
}

export interface UseMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  send: (content: string) => Promise<void>;
  streamingText: string;
  isSending: boolean;
}

export function useMessages({ sessionId, isOnline }: UseMessagesOptions): UseMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStreamingText("");

    (async () => {
      if (!isOnline) {
        if (!cancelled) {
          setMessages(getCachedMessages(sessionId));
          setLoading(false);
        }
        return;
      }

      try {
        const fetched = await getMessages(sessionId);
        if (cancelled) return;
        setMessages(fetched);
        cacheMessages(sessionId, fetched);
      } catch {
        if (!cancelled) setMessages(getCachedMessages(sessionId));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, isOnline]);

  const send = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || sendingRef.current) return;
      sendingRef.current = true;
      setIsSending(true);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, userMessage];
        cacheMessages(sessionId, next);
        return next;
      });
      setStreamingText("");

      try {
        await sendMessageRequest(sessionId, content, {
          onToken: (chunk) => setStreamingText((prev) => prev + chunk),
          onDone: (assistantMessage) => {
            setMessages((prev) => {
              const next = [...prev, assistantMessage];
              cacheMessages(sessionId, next);
              return next;
            });
            setStreamingText("");
          },
        });
      } catch {
        setMessages((prev) => {
          const next: ChatMessage[] = [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                "Sorry, that message couldn't be sent. Check your connection and try again.",
              created_at: new Date().toISOString(),
            },
          ];
          cacheMessages(sessionId, next);
          return next;
        });
        setStreamingText("");
      } finally {
        sendingRef.current = false;
        setIsSending(false);
      }
    },
    [sessionId],
  );

  return { messages, loading, send, streamingText, isSending };
}
