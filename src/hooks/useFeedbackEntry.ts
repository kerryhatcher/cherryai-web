import { useCallback, useEffect, useState } from "react";
import {
  deleteFeedbackEntry,
  getFeedbackEntry,
  investigateFeedbackEntry,
  planFeedbackEntry,
  triageFeedbackEntry,
  updateFeedbackEntry,
  WorkflowJobConflictError,
} from "@/api/feedback";
import { cacheFeedbackEntry, getCachedFeedbackEntry, removeCachedFeedbackEntry } from "@/lib/offlineCache";
import type { FeedbackEntry, FeedbackJobStage, FeedbackStatus } from "@/types";

const JOB_POLL_INTERVAL_MS = 2000;

const JOB_TRIGGERS: Record<FeedbackJobStage, (id: number) => Promise<unknown>> = {
  triage: triageFeedbackEntry,
  investigate: investigateFeedbackEntry,
  plan: planFeedbackEntry,
};

export type StartJobResult = { ok: true } | { ok: false; error: string };

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
  /** POSTs to /triage, /investigate, or /plan; on success the record starts polling until the job resolves. */
  startJob: (stage: FeedbackJobStage) => Promise<StartJobResult>;
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

  /** Re-fetches without the "loading" transition — used for job polling so the view doesn't flash a skeleton. */
  const refreshQuietly = useCallback(async () => {
    if (id === undefined || Number.isNaN(id) || !isOnline) return;
    try {
      const result = await getFeedbackEntry(id);
      if (result.found) {
        cacheFeedbackEntry(result.entry);
        setState({ status: "found", entry: result.entry, fromCache: false });
      } else {
        setState({ status: "not_found" });
      }
    } catch {
      // Transient poll failure — keep showing the last known state and try again next tick.
    }
  }, [id, isOnline]);

  // Poll while a job is running so the lock/chip survive navigating away and back (state derives
  // from the server record, not local component state). Never polls offline.
  useEffect(() => {
    if (state.status !== "found" || state.entry.job_status !== "running" || !isOnline) return;
    const timer = window.setInterval(() => {
      void refreshQuietly();
    }, JOB_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [state, isOnline, refreshQuietly]);

  const startJob = useCallback(
    async (stage: FeedbackJobStage): Promise<StartJobResult> => {
      if (id === undefined) return { ok: false, error: "Unknown entry" };
      try {
        await JOB_TRIGGERS[stage](id);
        await refreshQuietly();
        return { ok: true };
      } catch (err) {
        const error =
          err instanceof WorkflowJobConflictError
            ? err.message
            : "Couldn't start this job. Check your connection and try again.";
        return { ok: false, error };
      }
    },
    [id, refreshQuietly],
  );

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

  return { state, reload: load, remove, updateStatus, startJob };
}
