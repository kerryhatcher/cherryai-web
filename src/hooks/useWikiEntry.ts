import { useCallback, useEffect, useState } from "react";
import { deleteWikiEntry, getWikiEntry } from "@/api/wiki";
import { cacheWikiEntry, getCachedWikiEntry, removeCachedWikiEntry } from "@/lib/offlineCache";
import type { WikiEntry } from "@/types";

export type WikiEntryState =
  | { status: "loading" }
  /** Live entry, or a cached one served because the network call failed. */
  | { status: "found"; entry: WikiEntry; fromCache: boolean }
  /** Confirmed 404 from the API — safe to offer the "create it" flow. */
  | { status: "not_found" }
  /** Offline (or a network error) with nothing cached for this slug. */
  | { status: "unavailable" };

interface UseWikiEntryOptions {
  slug: string | undefined;
  isOnline: boolean;
}

export interface UseWikiEntryResult {
  state: WikiEntryState;
  reload: () => Promise<void>;
  /** Returns true on success. */
  remove: () => Promise<boolean>;
}

export function useWikiEntry({ slug, isOnline }: UseWikiEntryOptions): UseWikiEntryResult {
  const [state, setState] = useState<WikiEntryState>({ status: "loading" });

  const load = useCallback(async () => {
    if (!slug) return;
    setState({ status: "loading" });

    if (!isOnline) {
      const cached = getCachedWikiEntry(slug);
      setState(cached ? { status: "found", entry: cached, fromCache: true } : { status: "unavailable" });
      return;
    }

    try {
      const result = await getWikiEntry(slug);
      if (result.found) {
        cacheWikiEntry(result.entry);
        setState({ status: "found", entry: result.entry, fromCache: false });
      } else {
        setState({ status: "not_found" });
      }
    } catch {
      const cached = getCachedWikiEntry(slug);
      setState(cached ? { status: "found", entry: cached, fromCache: true } : { status: "unavailable" });
    }
  }, [slug, isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(async () => {
    if (!slug) return false;
    try {
      await deleteWikiEntry(slug);
      removeCachedWikiEntry(slug);
      return true;
    } catch {
      return false;
    }
  }, [slug]);

  return { state, reload: load, remove };
}
