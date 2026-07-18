import { useState } from "react";
import { Link } from "react-router";
import { Plus, Search } from "lucide-react";
import { AppFrame } from "@/components/layout/AppFrame";
import { Sidebar } from "@/components/chat/Sidebar";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWikiList } from "@/hooks/useWikiList";
import { formatRelativeTime } from "@/lib/relativeTime";
import type { WikiListItem, WikiSearchResult } from "@/types";

interface WikiIndexProps {
  isOnline: boolean;
}

/** ts_headline wraps matches in <b>; strip all markup rather than trusting it as HTML. */
function plainSnippet(html: string): string {
  return html.replace(/<[^>]+>/g, "");
}

type Row = { slug: string; title: string; tags: string[] } & (
  | { kind: "list"; updatedAt: string }
  | { kind: "search"; snippet: string }
);

export function WikiIndex({ isOnline }: WikiIndexProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { entries, loading, query, setQuery, searchResults, searching } = useWikiList({ isOnline });

  const sidebar = (
    <Sidebar
      section="wiki"
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
        (r: WikiSearchResult): Row => ({
          kind: "search",
          slug: r.slug,
          title: r.title,
          tags: r.tags,
          snippet: plainSnippet(r.snippet),
        }),
      )
    : entries.map(
        (e: WikiListItem): Row => ({
          kind: "list",
          slug: e.slug,
          title: e.title,
          tags: e.tags,
          updatedAt: e.updated_at,
        }),
      );

  const busy = showingSearch ? searching : loading;

  return (
    <AppFrame
      sidebar={sidebar}
      mobileTitle="Wiki"
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      <header className="hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
        <h2 className="text-sm font-medium text-foreground/90">Wiki</h2>
        {isOnline ? (
          <Button asChild size="sm" className="gap-1.5 bg-cherry text-primary-foreground hover:bg-cherry-bright">
            <Link to="/wiki/new">
              <Plus className="size-4" />
              New page
            </Link>
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5" disabled>
            <Plus className="size-4" />
            New page
          </Button>
        )}
      </header>

      {!isOnline && (
        <OfflineBanner message="You're offline — showing cached pages. Creating and editing resume when you reconnect." />
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="flex items-center gap-2 md:hidden">
          {isOnline ? (
            <Button asChild size="sm" className="gap-1.5 bg-cherry text-primary-foreground hover:bg-cherry-bright">
              <Link to="/wiki/new">
                <Plus className="size-4" />
                New page
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="gap-1.5" disabled>
              <Plus className="size-4" />
              New page
            </Button>
          )}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isOnline ? "Search pages…" : "Search unavailable offline"}
            disabled={!isOnline}
            className="w-full rounded-xl border border-input bg-card/80 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {busy && rows.length === 0 ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {showingSearch ? `No pages match "${query}".` : "No wiki pages yet — create the first one."}
          </p>
        ) : (
          <nav className="flex flex-col gap-2">
            {rows.map((row) => (
              <Link
                key={row.slug}
                to={`/wiki/${row.slug}`}
                className="group rounded-2xl border border-border bg-card/60 px-4 py-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cherry/40 hover:bg-card hover:shadow-[0_10px_30px_-16px_color-mix(in_oklch,var(--cherry)_75%,transparent)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate text-sm font-medium text-foreground">{row.title}</h3>
                  {row.kind === "list" && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelativeTime(row.updatedAt)}
                    </span>
                  )}
                </div>
                {row.kind === "search" && row.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.snippet}</p>
                )}
                {row.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {row.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </AppFrame>
  );
}
