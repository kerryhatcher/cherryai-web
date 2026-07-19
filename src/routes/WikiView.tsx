import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { AppFrame } from "@/components/layout/AppFrame";
import { Sidebar } from "@/components/chat/Sidebar";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Markdown } from "@/components/Markdown";
import { WikiTree } from "@/components/wiki/WikiTree";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWikiEntry } from "@/hooks/useWikiEntry";
import { useWikiList } from "@/hooks/useWikiList";
import { formatRelativeTime } from "@/lib/relativeTime";
import { titleFromSlug } from "@/lib/slugify";

interface WikiViewProps {
  isOnline: boolean;
}

export function WikiView({ isOnline }: WikiViewProps) {
  const { slug = "" } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { state, remove } = useWikiEntry({ slug, isOnline });
  const { entries, refresh } = useWikiList({ isOnline });

  const sidebar = (
    <Sidebar
      section="wiki"
      sessions={[]}
      activeSessionId={null}
      onSelect={() => {}}
      onNewChat={() => {}}
      disabled={!isOnline}
      isOnline={isOnline}
      wikiTree={
        <WikiTree
          entries={entries}
          activeSlug={slug}
          isOnline={isOnline}
          onRenamed={() => void refresh()}
        />
      }
    />
  );

  const handleDelete = async () => {
    if (!window.confirm("Delete this page? This can't be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    const ok = await remove();
    setDeleting(false);
    if (ok) {
      navigate("/wiki");
    } else {
      setDeleteError("Couldn't delete this page. Check your connection and try again.");
    }
  };

  const mobileTitle =
    state.status === "found" ? state.entry.title : state.status === "not_found" ? titleFromSlug(slug) : "Wiki";

  const editDeleteActions = (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/wiki/${slug}/edit`}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="size-3.5" />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">Reconnect to edit</span>
      )}
    </div>
  );

  return (
    <AppFrame
      sidebar={sidebar}
      mobileTitle={mobileTitle}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      <header className="hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
        <Link to="/wiki" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← All pages
        </Link>
        {state.status === "found" && editDeleteActions}
      </header>

      {!isOnline && (
        <OfflineBanner message="You're offline — showing a cached copy, read-only. Reconnect to edit." />
      )}

      <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        {state.status === "loading" && (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="mt-4 h-40 w-full rounded-2xl" />
          </div>
        )}

        {state.status === "unavailable" && (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium text-foreground">This page isn't cached for offline viewing.</p>
            <p className="text-sm text-muted-foreground">Reconnect to load it.</p>
          </div>
        )}

        {state.status === "not_found" && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-foreground">This page doesn&apos;t exist yet.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No wiki entry is saved at{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/wiki/{slug}</code>.
            </p>
            {isOnline ? (
              <Button asChild className="mt-2 gap-1.5 bg-cherry text-primary-foreground hover:bg-cherry-bright">
                <Link to={`/wiki/new?title=${encodeURIComponent(titleFromSlug(slug))}`}>Create it</Link>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Reconnect to create it.</p>
            )}
          </div>
        )}

        {state.status === "found" && (
          <article>
            {state.fromCache && (
              <p className="mb-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                Showing a cached copy.
              </p>
            )}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {state.entry.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Updated {formatRelativeTime(state.entry.updated_at)}</span>
              {state.entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
            {deleteError && <p className="mt-3 text-sm text-destructive">{deleteError}</p>}
            <Markdown
              content={state.entry.body}
              wikilinks
              className="prose prose-sm dark:prose-invert mt-6 max-w-none prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-muted prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-cherry prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-cherry prose-a:underline-offset-2"
            />
            <div className="mt-8 md:hidden">{editDeleteActions}</div>
          </article>
        )}
      </div>
    </AppFrame>
  );
}
