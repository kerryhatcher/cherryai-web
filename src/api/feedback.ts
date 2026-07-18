import { API_URL } from "@/lib/config";
import type {
  FeedbackEntry,
  FeedbackListItem,
  FeedbackPriority,
  FeedbackSearchResult,
  FeedbackStatus,
  FeedbackType,
} from "@/types";
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

export interface FeedbackFilters {
  type?: FeedbackType;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
}

function filterQuery(filters: FeedbackFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.priority) params.set("priority", filters.priority);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listFeedbackEntries(filters: FeedbackFilters = {}): Promise<FeedbackListItem[]> {
  return request(`/api/feedback${filterQuery(filters)}`);
}

export function searchFeedbackEntries(query: string): Promise<FeedbackSearchResult[]> {
  return request(`/api/feedback/search?q=${encodeURIComponent(query)}`);
}

export interface CreateFeedbackInput {
  title: string;
  type: FeedbackType;
  priority?: FeedbackPriority;
  tags?: string[];
  body?: string;
  investigation?: string;
  plan?: string;
}

export interface UpdateFeedbackInput {
  title?: string;
  tags?: string[];
  type?: FeedbackType;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  body?: string;
  investigation?: string;
  plan?: string;
}

export function createFeedbackEntry(input: CreateFeedbackInput): Promise<FeedbackEntry> {
  return request("/api/feedback", { method: "POST", body: JSON.stringify(input) });
}

export type GetFeedbackEntryResult = { found: true; entry: FeedbackEntry } | { found: false };

/** 404 is an expected outcome (unknown-id flow), not an error — never throws for it. */
export async function getFeedbackEntry(id: number): Promise<GetFeedbackEntryResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/feedback/${id}`, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    throw new ApiError(`Network request to /api/feedback/${id} failed`);
  }

  if (res.status === 404) return { found: false };
  if (!res.ok) {
    throw new ApiError(`/api/feedback/${id} responded with ${res.status}`, res.status);
  }

  const entry = (await res.json()) as FeedbackEntry;
  return { found: true, entry };
}

export function updateFeedbackEntry(id: number, input: UpdateFeedbackInput): Promise<FeedbackEntry> {
  return request(`/api/feedback/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteFeedbackEntry(id: number): Promise<void> {
  return request(`/api/feedback/${id}`, { method: "DELETE" });
}
