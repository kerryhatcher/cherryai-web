import { useCallback, useEffect, useRef, useState } from "react";
import { getMessages, sendMessage as sendMessageRequest } from "@/api/client";
import { cacheMessages, getCachedMessages } from "@/lib/offlineCache";
import type { ChatMessage } from "@/types";

interface UseMessagesOptions {
  sessionId: string | null;
  isOnline: boolean;
  /**
   * Fired after an assistant reply completes. `firstInSession` is true for the
   * opening exchange, when the backend assigns the session its real title.
   */
  onExchangeComplete?: (info: { firstInSession: boolean }) => void;
}

export interface UseMessagesResult {
  messages: ChatMessage[];
  loading: boolean;
  send: (content: string) => Promise<void>;
  streamingText: string;
  isSending: boolean;
  /** Silently re-fetch the thread from the server (no loading spinner). */
  reload: () => Promise<void>;
}

export function useMessages({
  sessionId,
  isOnline,
  onExchangeComplete,
}: UseMessagesOptions): UseMessagesResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  // Kept in refs so `send` can read the latest values without re-subscribing.
  const messageCountRef = useRef(0);
  messageCountRef.current = messages.length;
  const onExchangeCompleteRef = useRef(onExchangeComplete);
  onExchangeCompleteRef.current = onExchangeComplete;

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

  // Recovers replies that finished server-side while the page was suspended
  // (iOS kills in-flight streams when the app is backgrounded).
  const reload = useCallback(async () => {
    if (!sessionId || sendingRef.current) return;
    try {
      const fetched = await getMessages(sessionId);
      if (sendingRef.current) return;
      setMessages(fetched);
      cacheMessages(sessionId, fetched);
    } catch {
      // Ignore — the next successful fetch will recover.
    }
  }, [sessionId]);

  const send = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim() || sendingRef.current) return;
      sendingRef.current = true;
      setIsSending(true);
      const firstInSession = messageCountRef.current === 0;

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
            onExchangeCompleteRef.current?.({ firstInSession });
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

  return { messages, loading, send, streamingText, isSending, reload };
}
