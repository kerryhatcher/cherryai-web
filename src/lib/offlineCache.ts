import type { ChatMessage, FeedbackEntry, FeedbackListItem, Session, WikiEntry, WikiListItem } from "@/types";

const SESSIONS_KEY = "cherryai:sessions";
const MAX_CACHED_MESSAGES = 50;

const messagesKey = (sessionId: string) => `cherryai:messages:${sessionId}`;

const WIKI_LIST_KEY = "cherryai:wiki:list";
const WIKI_ENTRIES_KEY = "cherryai:wiki:entries";
const MAX_CACHED_WIKI_ENTRIES = 20;

const FEEDBACK_LIST_KEY = "cherryai:feedback:list";
const FEEDBACK_ENTRIES_KEY = "cherryai:feedback:entries";
const MAX_CACHED_FEEDBACK_ENTRIES = 20;

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

export function cacheWikiList(entries: WikiListItem[]): void {
  writeJSON(WIKI_LIST_KEY, entries);
}

export function getCachedWikiList(): WikiListItem[] {
  return readJSON(WIKI_LIST_KEY, []);
}

/** Keeps the last `MAX_CACHED_WIKI_ENTRIES` viewed entries, most-recent first. */
export function cacheWikiEntry(entry: WikiEntry): void {
  const existing = readJSON<WikiEntry[]>(WIKI_ENTRIES_KEY, []);
  const next = [entry, ...existing.filter((cached) => cached.slug !== entry.slug)].slice(
    0,
    MAX_CACHED_WIKI_ENTRIES,
  );
  writeJSON(WIKI_ENTRIES_KEY, next);
}

export function getCachedWikiEntry(slug: string): WikiEntry | null {
  const existing = readJSON<WikiEntry[]>(WIKI_ENTRIES_KEY, []);
  return existing.find((cached) => cached.slug === slug) ?? null;
}

export function removeCachedWikiEntry(slug: string): void {
  const existing = readJSON<WikiEntry[]>(WIKI_ENTRIES_KEY, []);
  writeJSON(
    WIKI_ENTRIES_KEY,
    existing.filter((cached) => cached.slug !== slug),
  );
}

export function cacheFeedbackList(entries: FeedbackListItem[]): void {
  writeJSON(FEEDBACK_LIST_KEY, entries);
}

export function getCachedFeedbackList(): FeedbackListItem[] {
  return readJSON(FEEDBACK_LIST_KEY, []);
}

/** Keeps the last `MAX_CACHED_FEEDBACK_ENTRIES` viewed entries, most-recent first. */
export function cacheFeedbackEntry(entry: FeedbackEntry): void {
  const existing = readJSON<FeedbackEntry[]>(FEEDBACK_ENTRIES_KEY, []);
  const next = [entry, ...existing.filter((cached) => cached.id !== entry.id)].slice(
    0,
    MAX_CACHED_FEEDBACK_ENTRIES,
  );
  writeJSON(FEEDBACK_ENTRIES_KEY, next);
}

export function getCachedFeedbackEntry(id: number): FeedbackEntry | null {
  const existing = readJSON<FeedbackEntry[]>(FEEDBACK_ENTRIES_KEY, []);
  return existing.find((cached) => cached.id === id) ?? null;
}

export function removeCachedFeedbackEntry(id: number): void {
  const existing = readJSON<FeedbackEntry[]>(FEEDBACK_ENTRIES_KEY, []);
  writeJSON(
    FEEDBACK_ENTRIES_KEY,
    existing.filter((cached) => cached.id !== id),
  );
}
