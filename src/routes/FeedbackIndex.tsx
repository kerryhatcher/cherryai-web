import { useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { AppFrame } from "@/components/layout/AppFrame";
import { Sidebar } from "@/components/chat/Sidebar";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Badge } from "@/components/feedback/Badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedbackList } from "@/hooks/useFeedbackList";
import { formatRelativeTime } from "@/lib/relativeTime";
import {
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  priorityBadge,
  statusBadge,
  typeBadge,
} from "@/lib/feedbackBadges";
import { cn } from "@/lib/utils";
import type { FeedbackListItem, FeedbackPriority, FeedbackSearchResult, FeedbackStatus, FeedbackType } from "@/types";

interface FeedbackIndexProps {
  isOnline: boolean;
}

/** ts_headline wraps matches in <b>; strip all markup rather than trusting it as HTML. */
function plainSnippet(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

type Row = {
  id: number;
  title: string;
  type: FeedbackType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  jobRunning: boolean;
} & (
  | { kind: "list"; tags: string[]; updatedAt: string }
  | { kind: "search"; snippet: string }
);

function FilterChips<T extends string>({
  values,
  active,
  onToggle,
  toneOf,
}: {
  values: T[];
  active: T | null;
  onToggle: (value: T) => void;
  toneOf: (value: T) => { label: string; tone: string };
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value) => {
        const { label, tone } = toneOf(value);
        const isActive = active === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-all",
              isActive
                ? cn(tone, "ring-1 ring-inset ring-current/25")
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function FeedbackIndex({ isOnline }: FeedbackIndexProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
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
  } = useFeedbackList({ isOnline });

  const sidebar = (
    <Sidebar
      section="feedback"
      sessions={[]}
      activeSessionId={null}
      onSelect={() => {}}
      onNewChat={() => {}}
      disabled={!isOnline}
      isOnline={isOnline}
    />
  );

  const showingSearch = query.trim().length > 0;
  const rows: Row[] = showingSearch
    ? (searchResults ?? []).map(
        (r: FeedbackSearchResult): Row => ({
          kind: "search",
          id: r.id,
          title: r.title,
          type: r.type,
          status: r.status,
          priority: r.priority,
          jobRunning: false,
          snippet: plainSnippet(r.snippet),
        }),
      )
    : entries.map(
        (e: FeedbackListItem): Row => ({
          kind: "list",
          id: e.id,
          title: e.title,
          type: e.type,
          status: e.status,
          priority: e.priority,
          jobRunning: e.job_status === "running",
          tags: e.tags,
          updatedAt: e.updated_at,
        }),
      );

  const busy = showingSearch ? searching : loading;

  const newButton = isOnline ? (
    <Button asChild size="sm" className="gap-1.5 bg-cherry text-primary-foreground hover:bg-cherry-bright">
      <Link to="/feedback/new">
        <Plus className="size-4" />
        New feedback
      </Link>
    </Button>
  ) : (
    <Button size="sm" className="gap-1.5" disabled>
      <Plus className="size-4" />
      New feedback
    </Button>
  );

  return (
    <AppFrame
      sidebar={sidebar}
      mobileTitle="Feedback"
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      <header className="hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
        <h2 className="text-sm font-medium text-foreground/90">Feedback</h2>
        {newButton}
      </header>

      {!isOnline && (
        <OfflineBanner message="You're offline — showing cached feedback. Creating, editing, and status changes resume when you reconnect." />
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2 md:hidden">{newButton}</div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isOnline ? "Search feedback…" : "Search unavailable offline"}
            disabled={!isOnline}
            className="w-full rounded-xl border border-input bg-card/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {!showingSearch && (
          <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card/40 px-3.5 py-3">
            <FilterChips values={FEEDBACK_TYPES} active={filters.type} onToggle={toggleTypeFilter} toneOf={typeBadge} />
            <FilterChips
              values={FEEDBACK_STATUSES}
              active={filters.status}
              onToggle={toggleStatusFilter}
              toneOf={statusBadge}
            />
            <FilterChips
              values={FEEDBACK_PRIORITIES}
              active={filters.priority}
              onToggle={togglePriorityFilter}
              toneOf={priorityBadge}
            />
          </div>
        )}

        {busy && rows.length === 0 ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {showingSearch
              ? `No feedback matches "${query}".`
              : "No feedback yet — file the first bug, feature, or story."}
          </p>
        ) : (
          <nav className="flex flex-col gap-2">
            {rows.map((row) => (
              <Link
                key={row.id}
                to={`/feedback/${row.id}`}
                className="group rounded-2xl border border-border bg-card/60 px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cherry/40 hover:bg-card hover:shadow-[0_10px_30px_-16px_color-mix(in_oklch,var(--cherry)_75%,transparent)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">#{row.id}</span>
                    <h3 className="truncate text-sm font-medium text-foreground">{row.title}</h3>
                    {row.jobRunning && (
                      <span
                        className="size-1.5 shrink-0 animate-pulse rounded-full bg-amber-500"
                        title="AI workflow running"
                        aria-label="AI workflow running"
                      />
                    )}
                  </div>
                  {row.kind === "list" && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(row.updatedAt)}
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge {...typeBadge(row.type)} />
                  <Badge {...statusBadge(row.status)} />
                  <Badge {...priorityBadge(row.priority)} />
                  {row.kind === "list" &&
                    row.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
                {row.kind === "search" && row.snippet && (
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{row.snippet}</p>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </AppFrame>
  );
}
