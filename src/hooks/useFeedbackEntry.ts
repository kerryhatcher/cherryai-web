import { useCallback, useEffect, useState } from "react";
import { deleteFeedbackEntry, getFeedbackEntry, updateFeedbackEntry } from "@/api/feedback";
import { cacheFeedbackEntry, getCachedFeedbackEntry, removeCachedFeedbackEntry } from "@/lib/offlineCache";
import type { FeedbackEntry, FeedbackStatus } from "@/types";

export type FeedbackEntryState =
  | { status: "loading" }
  /** Live entry, or a cached one served because the network call failed. */
  | { status: "found"; entry: FeedbackEntry; fromCache: boolean }
  /** Confirmed 404 (or a non-numeric id) — safe to offer the "back to list" flow. */
  | { status: "not_found" }
  /** Offline (or a network error) with nothing cached for this id. */
  | { status: "unavailable" };

interface UseFeedbackEntryOptions {
  id: number | undefined;
  isOnline: boolean;
}

export interface UseFeedbackEntryResult {
  state: FeedbackEntryState;
  reload: () => Promise<void>;
  /** Returns true on success. */
  remove: () => Promise<boolean>;
  /** Optimistic PUT of just {status}; reverts on failure. Returns true on success. */
  updateStatus: (status: FeedbackStatus) => Promise<boolean>;
}

export function useFeedbackEntry({ id, isOnline }: UseFeedbackEntryOptions): UseFeedbackEntryResult {
  const [state, setState] = useState<FeedbackEntryState>({ status: "loading" });

  const load = useCallback(async () => {
    if (id === undefined || Number.isNaN(id)) {
      setState({ status: "not_found" });
      return;
    }
    setState({ status: "loading" });

    if (!isOnline) {
      const cached = getCachedFeedbackEntry(id);
      setState(cached ? { status: "found", entry: cached, fromCache: true } : { status: "unavailable" });
      return;
    }

    try {
      const result = await getFeedbackEntry(id);
      if (result.found) {
        cacheFeedbackEntry(result.entry);
        setState({ status: "found", entry: result.entry, fromCache: false });
      } else {
        setState({ status: "not_found" });
      }
    } catch {
      const cached = getCachedFeedbackEntry(id);
      setState(cached ? { status: "found", entry: cached, fromCache: true } : { status: "unavailable" });
    }
  }, [id, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(async () => {
    if (id === undefined) return false;
    try {
      await deleteFeedbackEntry(id);
      removeCachedFeedbackEntry(id);
      return true;
    } catch {
      return false;
    }
  }, [id]);

  const updateStatus = useCallback(
    async (nextStatus: FeedbackStatus) => {
      if (id === undefined || state.status !== "found") return false;
      const previous = state.entry;
      setState({ status: "found", entry: { ...previous, status: nextStatus }, fromCache: false });

      try {
        const updated = await updateFeedbackEntry(id, { status: nextStatus });
        cacheFeedbackEntry(updated);
        setState({ status: "found", entry: updated, fromCache: false });
        return true;
      } catch {
        setState({ status: "found", entry: previous, fromCache: false });
        return false;
      }
    },
    [id, state],
  );

  return { state, reload: load, remove, updateStatus };
}
