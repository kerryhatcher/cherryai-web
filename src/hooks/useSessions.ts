import { useCallback, useEffect, useState } from "react";
import { createSession, listSessions } from "@/api/client";
import { cacheSessions, getCachedSessions } from "@/lib/offlineCache";
import type { Session } from "@/types";

interface UseSessionsOptions {
  isOnline: boolean;
}

export interface UseSessionsResult {
  sessions: Session[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  newSession: () => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

/**
 * Loads the session list and auto-creates the first session on a fresh visit
 * so a user can start chatting immediately with no setup step.
 */
export function useSessions({ isOnline }: UseSessionsOptions): UseSessionsResult {
  const [sessions, setSessions] = useState<Session[]>(() => getCachedSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isOnline) {
        const cached = getCachedSessions();
        if (!cancelled) {
          setSessions(cached);
          setActiveSessionId((current) => current ?? cached[0]?.id ?? null);
          setLoading(false);
        }
        return;
      }

      try {
        let fetched = await listSessions();
        if (fetched.length === 0) {
          const created = await createSession();
          fetched = [created];
        }
        if (cancelled) return;
        setSessions(fetched);
        cacheSessions(fetched);
        setActiveSessionId((current) => current ?? fetched[0]?.id ?? null);
      } catch {
        if (!cancelled) setSessions(getCachedSessions());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  /**
   * Re-fetch the session list without disturbing the active selection. Used
   * after a session's first message so the server-generated title (which
   * replaces the placeholder "New chat") shows up in the sidebar.
   */
  const refresh = useCallback(async () => {
    if (!isOnline) return;
    try {
      const fetched = await listSessions();
      setSessions(fetched);
      cacheSessions(fetched);
    } catch {
      // Keep the current list if the refresh fails.
    }
  }, [isOnline]);

  const newSession = useCallback(async () => {
    if (!isOnline) return;
    try {
      const created = await createSession();
      setSessions((prev) => {
        const next = [created, ...prev];
        cacheSessions(next);
        return next;
      });
      setActiveSessionId(created.id);
    } catch {
      // Offline or the request failed mid-flight — no new session appears.
    }
  }, [isOnline]);

  return { sessions, activeSessionId, setActiveSessionId, newSession, refresh, loading };
}
