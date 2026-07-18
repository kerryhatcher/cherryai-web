import { useCallback, useEffect, useState } from "react";
import { listWikiEntries, searchWikiEntries } from "@/api/wiki";
import { cacheWikiList, getCachedWikiList } from "@/lib/offlineCache";
import type { WikiListItem, WikiSearchResult } from "@/types";

const SEARCH_DEBOUNCE_MS = 250;

interface UseWikiListOptions {
  isOnline: boolean;
}

export interface UseWikiListResult {
  entries: WikiListItem[];
  loading: boolean;
  query: string;
  setQuery: (query: string) => void;
  /** Null when the search box is empty — index shows `entries` instead. */
  searchResults: WikiSearchResult[] | null;
  searching: boolean;
  refresh: () => Promise<void>;
}

/** Full list (offline-cached) plus debounced full-text search when a query is typed. */
export function useWikiList({ isOnline }: UseWikiListOptions): UseWikiListResult {
  const [entries, setEntries] = useState<WikiListItem[]>(() => getCachedWikiList());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WikiSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    if (!isOnline) {
      setEntries(getCachedWikiList());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetched = await listWikiEntries();
      setEntries(fetched);
      cacheWikiList(fetched);
    } catch {
      setEntries(getCachedWikiList());
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || !isOnline) {
      setSearchResults(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      searchWikiEntries(trimmed)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, isOnline]);

  return { entries, loading, query, setQuery, searchResults, searching, refresh: load };
}
