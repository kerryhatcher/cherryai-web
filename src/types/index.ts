export interface Session {
  id: string;
  title: string;
  created_at: string;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  created_at: string;
}

/** Row shape returned by `GET /api/wiki` — no body. */
export interface WikiListItem {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  updated_at: string;
}

/** Full entry shape returned by `GET/POST/PUT /api/wiki/...`. */
export interface WikiEntry {
  id: string;
  slug: string;
  title: string;
  tags: string[];
  body: string;
  created_at: string;
  updated_at: string;
}

/** One hit from `GET /api/wiki/search?q=`. */
export interface WikiSearchResult {
  slug: string;
  title: string;
  tags: string[];
  snippet: string;
  rank: number;
}

export type FeedbackType = "bug" | "feature" | "user_story";
export type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed" | "wontfix";
export type FeedbackPriority = "low" | "medium" | "high" | "critical";

/** Row shape returned by `GET /api/feedback` — no markdown fields. */
export interface FeedbackListItem {
  id: number;
  title: string;
  tags: string[];
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  updated_at: string;
}

/** Full entry shape returned by `GET/POST/PUT /api/feedback/...`. */
export interface FeedbackEntry {
  id: number;
  title: string;
  tags: string[];
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  body: string;
  investigation: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

/** One hit from `GET /api/feedback/search?q=`. */
export interface FeedbackSearchResult {
  id: number;
  title: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  snippet: string;
  rank: number;
}
