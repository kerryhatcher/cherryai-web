import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Eye, Pencil } from "lucide-react";
import { AppFrame } from "@/components/layout/AppFrame";
import { Sidebar } from "@/components/chat/Sidebar";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Markdown } from "@/components/Markdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createFeedbackEntry, updateFeedbackEntry } from "@/api/feedback";
import { useFeedbackEntry } from "@/hooks/useFeedbackEntry";
import { FEEDBACK_PRIORITIES, FEEDBACK_STATUSES, FEEDBACK_TYPES, priorityBadge, statusBadge, typeBadge } from "@/lib/feedbackBadges";
import { cn } from "@/lib/utils";
import type { FeedbackPriority, FeedbackStatus, FeedbackType } from "@/types";

interface FeedbackEditorProps {
  mode: "create" | "edit";
  isOnline: boolean;
}

const parseTags = (raw: string): string[] =>
  raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

type FieldKey = "body" | "investigation" | "plan";

const FIELD_TABS: { key: FieldKey; label: string; placeholder: string }[] = [
  { key: "body", label: "Description", placeholder: "Describe the bug, feature, or story…" },
  { key: "investigation", label: "Investigation", placeholder: "What did you find while investigating?" },
  { key: "plan", label: "Implementation Plan", placeholder: "How will this be implemented?" },
];

const inputClassName =
  "w-full rounded-xl border border-input bg-card/80 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-cherry/50";

const proseClassName =
  "prose prose-sm dark:prose-invert min-h-60 max-w-none rounded-xl border border-border bg-card/60 px-4 py-3 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-muted prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-cherry prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-cherry prose-a:underline-offset-2";

export function FeedbackEditor({ mode, isOnline }: FeedbackEditorProps) {
  const { id: idParam = "" } = useParams<{ id: string }>();
  const id = Number.parseInt(idParam, 10);
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { state } = useFeedbackEntry({
    id: mode === "edit" && !Number.isNaN(id) ? id : undefined,
    isOnline,
  });
  const initializedRef = useRef(false);

  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [type, setType] = useState<FeedbackType>("bug");
  const [priority, setPriority] = useState<FeedbackPriority>("medium");
  const [status, setStatus] = useState<FeedbackStatus>("open");
  const [fields, setFields] = useState<Record<FieldKey, string>>({ body: "", investigation: "", plan: "" });
  const [activeTab, setActiveTab] = useState<FieldKey>("body");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "edit" && state.status === "found" && !initializedRef.current) {
      initializedRef.current = true;
      setTitle(state.entry.title);
      setTagsInput(state.entry.tags.join(", "));
      setType(state.entry.type);
      setPriority(state.entry.priority);
      setStatus(state.entry.status);
      setFields({ body: state.entry.body, investigation: state.entry.investigation, plan: state.entry.plan });
    }
  }, [mode, state]);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || preview) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 240), 640)}px`;
  }, [fields, activeTab, preview]);

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

    try {
      if (mode === "create") {
        const entry = await createFeedbackEntry({
          title: trimmedTitle,
          type,
          priority,
          tags,
          body: fields.body,
          investigation: fields.investigation,
          plan: fields.plan,
        });
        navigate(`/feedback/${entry.id}`);
      } else {
        const entry = await updateFeedbackEntry(id, {
          title: trimmedTitle,
          type,
          status,
          priority,
          tags,
          body: fields.body,
          investigation: fields.investigation,
          plan: fields.plan,
        });
        navigate(`/feedback/${entry.id}`);
      }
    } catch {
      // Drafts (title, tags, type/priority/status, and all three markdown fields) are
      // intentionally left in place on failure so the user doesn't lose work.
      setError("Couldn't save this entry. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const loadingExisting = mode === "edit" && state.status === "loading";
  const editTargetMissing = mode === "edit" && (state.status === "not_found" || state.status === "unavailable");

  const heading = mode === "create" ? "New feedback" : `Edit ${title || `#${idParam}`}`;

  return (
    <AppFrame
      sidebar={sidebar}
      mobileTitle={heading}
      mobileNavOpen={mobileNavOpen}
      onMobileNavOpenChange={setMobileNavOpen}
    >
      <header className="hidden items-center justify-between border-b border-border px-6 py-3 md:flex">
        <h2 className="text-sm font-medium text-foreground/90">{heading}</h2>
      </header>

      {!isOnline && (
        <OfflineBanner message="You're offline — creating and editing feedback resumes when you reconnect." />
      )}

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
        {!isOnline ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Reconnect to {mode === "create" ? "file new feedback" : "edit this entry"}.
          </p>
        ) : loadingExisting ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-8 w-1/2 rounded-xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : editTargetMissing ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t find feedback at{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/feedback/{idParam}</code> to edit.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-title" className="text-xs font-medium text-muted-foreground">
                Title
              </label>
              <input
                id="feedback-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short summary"
                className={inputClassName}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="feedback-tags" className="text-xs font-medium text-muted-foreground">
                Tags <span className="font-normal text-muted-foreground/70">(comma-separated)</span>
              </label>
              <input
                id="feedback-tags"
                value={tagsInput}
                onChange={(event) => setTagsInput(event.target.value)}
                placeholder="onboarding, api"
                className={inputClassName}
              />
            </div>

            <div className={cn("grid gap-3", mode === "edit" ? "grid-cols-3" : "grid-cols-2")}>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-type" className="text-xs font-medium text-muted-foreground">
                  Type
                </label>
                <select
                  id="feedback-type"
                  value={type}
                  onChange={(event) => setType(event.target.value as FeedbackType)}
                  className={inputClassName}
                >
                  {FEEDBACK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {typeBadge(t).label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="feedback-priority" className="text-xs font-medium text-muted-foreground">
                  Priority
                </label>
                <select
                  id="feedback-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as FeedbackPriority)}
                  className={inputClassName}
                >
                  {FEEDBACK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {priorityBadge(p).label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "edit" && (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="feedback-status" className="text-xs font-medium text-muted-foreground">
                    Status
                  </label>
                  <select
                    id="feedback-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as FeedbackStatus)}
                    className={inputClassName}
                  >
                    {FEEDBACK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusBadge(s).label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  {FIELD_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                        activeTab === tab.key
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1 rounded-lg bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className={cn(
                      "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      !preview ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
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
                      preview ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Eye className="size-3" />
                    Preview
                  </button>
                </div>
              </div>

              {preview ? (
                <Markdown
                  content={fields[activeTab] || "*Nothing to preview yet.*"}
                  feedbackLinks
                  className={proseClassName}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  value={fields[activeTab]}
                  onChange={(event) => setFields((prev) => ({ ...prev, [activeTab]: event.target.value }))}
                  placeholder={FIELD_TABS.find((t) => t.key === activeTab)?.placeholder}
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
