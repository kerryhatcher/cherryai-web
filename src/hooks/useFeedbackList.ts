import { useCallback, useEffect, useState } from "react";
import { listFeedbackEntries, searchFeedbackEntries } from "@/api/feedback";
import { cacheFeedbackList, getCachedFeedbackList } from "@/lib/offlineCache";
import type { FeedbackListItem, FeedbackPriority, FeedbackSearchResult, FeedbackStatus, FeedbackType } from "@/types";

const SEARCH_DEBOUNCE_MS = 250;

export interface FeedbackFilterState {
  type: FeedbackType | null;
  status: FeedbackStatus | null;
  priority: FeedbackPriority | null;
}

const NO_FILTERS: FeedbackFilterState = { type: null, status: null, priority: null };

function matchesFilters(entry: FeedbackListItem, filters: FeedbackFilterState): boolean {
  if (filters.type && entry.type !== filters.type) return false;
  if (filters.status && entry.status !== filters.status) return false;
  if (filters.priority && entry.priority !== filters.priority) return false;
  return true;
}

interface UseFeedbackListOptions {
  isOnline: boolean;
}

export interface UseFeedbackListResult {
  entries: FeedbackListItem[];
  loading: boolean;
  filters: FeedbackFilterState;
  toggleTypeFilter: (value: FeedbackType) => void;
  toggleStatusFilter: (value: FeedbackStatus) => void;
  togglePriorityFilter: (value: FeedbackPriority) => void;
  query: string;
  setQuery: (query: string) => void;
  /** Null when the search box is empty — index shows `entries` instead. */
  searchResults: FeedbackSearchResult[] | null;
  searching: boolean;
  refresh: () => Promise<void>;
}

/** Filtered list (offline-cached, filtered client-side when offline) plus debounced FTS when a query is typed. */
export function useFeedbackList({ isOnline }: UseFeedbackListOptions): UseFeedbackListResult {
  const [entries, setEntries] = useState<FeedbackListItem[]>(() => getCachedFeedbackList());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FeedbackFilterState>(NO_FILTERS);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FeedbackSearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    if (!isOnline) {
      setEntries(getCachedFeedbackList().filter((entry) => matchesFilters(entry, filters)));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetched = await listFeedbackEntries({
        type: filters.type ?? undefined,
        status: filters.status ?? undefined,
        priority: filters.priority ?? undefined,
      });
      setEntries(fetched);
      // Only the unfiltered "all" list is cached — offline filtering is applied client-side against it.
      if (filters.type === null && filters.status === null && filters.priority === null) {
        cacheFeedbackList(fetched);
      }
    } catch {
      setEntries(getCachedFeedbackList().filter((entry) => matchesFilters(entry, filters)));
    } finally {
      setLoading(false);
    }
  }, [isOnline, filters]);

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
      searchFeedbackEntries(trimmed)
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

  const toggleTypeFilter = useCallback((value: FeedbackType) => {
    setFilters((prev) => ({ ...prev, type: prev.type === value ? null : value }));
  }, []);
  const toggleStatusFilter = useCallback((value: FeedbackStatus) => {
    setFilters((prev) => ({ ...prev, status: prev.status === value ? null : value }));
  }, []);
  const togglePriorityFilter = useCallback((value: FeedbackPriority) => {
    setFilters((prev) => ({ ...prev, priority: prev.priority === value ? null : value }));
  }, []);

  return {
    entries,
    loading,
    filters,
    toggleTypeFilter,
    toggleStatusFilter,
    togglePriorityFilter,
    query,
    setQuery,
    searchResults,
    searching,
    refresh: load,
  };
}
