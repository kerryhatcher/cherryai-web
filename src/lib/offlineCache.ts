import type { ChatMessage, Session } from "@/types";

const SESSIONS_KEY = "cherryai:sessions";
const MAX_CACHED_MESSAGES = 50;

const messagesKey = (sessionId: string) => `cherryai:messages:${sessionId}`;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or unavailable (e.g. Safari private mode) — cache is best-effort.
  }
}

export function cacheSessions(sessions: Session[]): void {
  writeJSON(SESSIONS_KEY, sessions);
}

export function getCachedSessions(): Session[] {
  return readJSON(SESSIONS_KEY, []);
}

export function cacheMessages(sessionId: string, messages: ChatMessage[]): void {
  writeJSON(messagesKey(sessionId), messages.slice(-MAX_CACHED_MESSAGES));
}

export function getCachedMessages(sessionId: string): ChatMessage[] {
  return readJSON(messagesKey(sessionId), []);
}
