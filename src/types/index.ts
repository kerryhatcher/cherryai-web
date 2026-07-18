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
