import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { Eye, Pencil } from "lucide-react";
import { AppFrame } from "@/components/layout/AppFrame";
import { Sidebar } from "@/components/chat/Sidebar";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Markdown } from "@/components/Markdown";
import { WikiTree } from "@/components/wiki/WikiTree";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createWikiEntry, updateWikiEntry, WikiTitleConflictError } from "@/api/wiki";
import { ApiError } from "@/api/errors";
import { useWikiEntry } from "@/hooks/useWikiEntry";
import { useWikiList } from "@/hooks/useWikiList";
import { folderPaths } from "@/lib/wikiTree";
import { cn } from "@/lib/utils";

interface WikiEditorProps {
  mode: "create" | "edit";
  isOnline: boolean;
}

const parseTags = (raw: string): string[] =>
  raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

export function WikiEditor({ mode, isOnline }: WikiEditorProps) {
  const { slug = "" } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { state } = useWikiEntry({ slug: mode === "edit" ? slug : undefined, isOnline });
  const { entries, refresh } = useWikiList({ isOnline });
  const initializedRef = useRef(false);

  const [title, setTitle] = useState(() => (mode === "create" ? (searchParams.get("title") ?? "") : ""));
  const [tagsInput, setTagsInput] = useState("");
  const [body, setBody] = useState("");
  const [folder, setFolder] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "edit" && state.status === "found" && !initializedRef.current) {
      initializedRef.current = true;
      setTitle(state.entry.title);
      setTagsInput(state.entry.tags.join(", "));
      setBody(state.entry.body);
      setFolder(state.entry.folder ?? "");
    }
  }, [mode, state]);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el || preview) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 240), 640)}px`;
  }, [body, preview]);

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

  const handleCancel = () => navigate(-1);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    setError(null);
    const tags = parseTags(tagsInput);
    const trimmedFolder = folder.trim();

    try {
      if (mode === "create") {
        const entry = await createWikiEntry({
          title: trimmedTitle,
          tags,
          body,
          folder: trimmedFolder,
        });
        navigate(`/wiki/${entry.slug}`);
      } else {
        const entry = await updateWikiEntry(slug, {
          title: trimmedTitle,
          tags,
          body,
          folder: trimmedFolder,
        });
        navigate(`/wiki/${entry.slug}`);
      }
    } catch (err) {
      // Draft is intentionally left in place so the user doesn't lose work.
      if (err instanceof WikiTitleConflictError) {
        setError(err.message);
      } else if (err instanceof ApiError && err.status === 400) {
        setError(err.detail ?? "Check the folder path — it may be too deep or too long.");
      } else {
        setError("Couldn't save this page. Check your connection and try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const loadingExisting = mode === "edit" && state.status === "loading";
  const editTargetMissing = mode === "edit" && (state.status === "not_found" || state.status === "unavailable");

  return (
    <AppFrame
      sidebar={sidebar}
      mobileTitle={mode === "create" ? "New page" : `Edit ${title || slug}`}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      <header className="hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
        <h2 className="text-sm font-medium text-foreground/90">
          {mode === "create" ? "New page" : `Edit ${title || slug}`}
        </h2>
      </header>

      {!isOnline && (
        <OfflineBanner message="You're offline — creating and editing pages resume when you reconnect." />
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        {!isOnline ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Reconnect to {mode === "create" ? "create a new page" : "edit this page"}.
          </p>
        ) : loadingExisting ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-8 w-1/2 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : editTargetMissing ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t find a page at <code className="rounded bg-muted px-1 py-0.5 text-xs">/wiki/{slug}</code>{" "}
            to edit.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wiki-title" className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <input
                id="wiki-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Page title"
                className="w-full rounded-xl border border-input bg-card/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="wiki-folder" className="text-xs font-medium text-muted-foreground">
                Folder{" "}
                <span className="font-normal text-muted-foreground/70">
                  (optional, e.g. research/ocr)
                </span>
              </label>
              <input
                id="wiki-folder"
                list="wiki-folder-options"
                value={folder}
                onChange={(event) => setFolder(event.target.value)}
                placeholder="Leave empty for the top level"
                className="w-full rounded-xl border border-input bg-card/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50"
              />
              <datalist id="wiki-folder-options">
                {folderPaths(entries).map((path) => (
                  <option key={path} value={path} />
                ))}
              </datalist>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="wiki-tags" className="text-xs font-medium text-muted-foreground">
                Tags <span className="font-normal text-muted-foreground/70">(comma-separated)</span>
              </label>
              <input
                id="wiki-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="reference, howto"
                className="w-full rounded-xl border border-input bg-card/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="wiki-body" className="text-xs font-medium text-muted-foreground">
                  Body <span className="font-normal text-muted-foreground/70">(markdown)</span>
                </label>
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      !preview
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Pencil className="size-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(true)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      preview
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Eye className="size-3" />
                    Preview
                  </button>
                </div>
              </div>

              {preview ? (
                <Markdown
                  content={body || "*Nothing to preview yet.*"}
                  wikilinks
                  className="prose prose-sm dark:prose-invert min-h-60 max-w-none rounded-xl border border-border bg-card/60 px-4 py-3 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-muted prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-cherry prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-cherry prose-a:underline-offset-2"
                />
              ) : (
                <textarea
                  ref={bodyRef}
                  id="wiki-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Write in markdown… use [[Page Title]] to link other wiki pages."
                  className="min-h-60 w-full resize-none rounded-xl border border-input bg-card/80 px-3.5 py-3 font-mono text-sm leading-relaxed text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-cherry/50"
                />
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pb-4">
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-cherry text-primary-foreground hover:bg-cherry-bright"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppFrame>
  );
}
