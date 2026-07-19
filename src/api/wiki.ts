import { API_URL } from "@/lib/config";
import type { WikiEntry, WikiListItem, WikiSearchResult } from "@/types";
import { ApiError } from "./errors";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError(`Network request to ${path} failed`);
  }

  if (!res.ok) {
    throw new ApiError(`${path} responded with ${res.status}`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function listWikiEntries(): Promise<WikiListItem[]> {
  return request("/api/wiki");
}

export function searchWikiEntries(query: string): Promise<WikiSearchResult[]> {
  return request(`/api/wiki/search?q=${encodeURIComponent(query)}`);
}

export interface CreateWikiInput {
  title: string;
  tags?: string[];
  body?: string;
  folder?: string;
}

export interface UpdateWikiInput {
  title?: string;
  tags?: string[];
  body?: string;
  folder?: string;
}

/** Duplicate slug on create — surfaced separately so the form can show an inline error. */
export class WikiTitleConflictError extends Error {
  constructor() {
    super("A page with this title already exists");
    this.name = "WikiTitleConflictError";
  }
}

export async function createWikiEntry(input: CreateWikiInput): Promise<WikiEntry> {
  try {
    return await request("/api/wiki", { method: "POST", body: JSON.stringify(input) });
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) throw new WikiTitleConflictError();
    throw err;
  }
}

export type GetWikiEntryResult =
  | { found: true; entry: WikiEntry }
  | { found: false };

/** 404 is an expected outcome (missing-page flow), not an error — never throws for it. */
export async function getWikiEntry(slug: string): Promise<GetWikiEntryResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/wiki/${encodeURIComponent(slug)}`, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new ApiError(`Network request to /api/wiki/${slug} failed`);
  }

  if (res.status === 404) return { found: false };
  if (!res.ok) {
    throw new ApiError(`/api/wiki/${slug} responded with ${res.status}`, res.status);
  }

  const entry = (await res.json()) as WikiEntry;
  return { found: true, entry };
}

export function updateWikiEntry(slug: string, input: UpdateWikiInput): Promise<WikiEntry> {
  return request(`/api/wiki/${encodeURIComponent(slug)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteWikiEntry(slug: string): Promise<void> {
  return request(`/api/wiki/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

/** Move a folder and everything under it. Resolves with the number of pages moved. */
export function renameWikiFolder(from: string, to: string): Promise<{ moved: number }> {
  return request("/api/wiki/folders/rename", {
    method: "POST",
    body: JSON.stringify({ from, to }),
  });
}
