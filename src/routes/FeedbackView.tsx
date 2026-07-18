import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import { AppFrame } from "@/components/layout/AppFrame";
import { Sidebar } from "@/components/chat/Sidebar";
import { OfflineBanner } from "@/components/chat/OfflineBanner";
import { Markdown } from "@/components/Markdown";
import { Badge } from "@/components/feedback/Badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeedbackEntry } from "@/hooks/useFeedbackEntry";
import { formatRelativeTime } from "@/lib/relativeTime";
import { FEEDBACK_STATUSES, priorityBadge, statusBadge, typeBadge } from "@/lib/feedbackBadges";
import type { FeedbackJobStage, FeedbackStatus } from "@/types";

const JOB_STAGE_LABEL: Record<FeedbackJobStage, string> = {
  triage: "Triage",
  investigate: "Investigate",
  plan: "Plan",
};

interface FeedbackViewProps {
  isOnline: boolean;
}

const proseClassName =
  "prose prose-sm dark:prose-invert mt-3 max-w-none prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:bg-muted prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-cherry prose-code:before:content-[''] prose-code:after:content-[''] prose-a:text-cherry prose-a:underline-offset-2";

function Section({ title, content }: { title: string; content: string }) {
  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground/80">{title}</h2>
      {content.trim() ? (
        <Markdown content={content} feedbackLinks className={proseClassName} />
      ) : (
        <p className="mt-3 text-sm text-muted-foreground/70 italic">No {title.toLowerCase()} yet.</p>
      )}
    </section>
  );
}

export function FeedbackView({ isOnline }: FeedbackViewProps) {
  const { id: idParam = "" } = useParams<{ id: string }>();
  const id = Number.parseInt(idParam, 10);
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [jobActionError, setJobActionError] = useState<string | null>(null);
  const [jobActionPending, setJobActionPending] = useState<FeedbackJobStage | null>(null);
  const { state, remove, updateStatus, startJob } = useFeedbackEntry({
    id: Number.isNaN(id) ? undefined : id,
    isOnline,
  });

  const locked = state.status === "found" && state.entry.job_status === "running";

  const handleRunJob = async (stage: FeedbackJobStage) => {
    setJobActionError(null);
    setJobActionPending(stage);
    const result = await startJob(stage);
    setJobActionPending(null);
    if (!result.ok) setJobActionError(result.error);
  };

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

  const handleDelete = async () => {
    if (!window.confirm("Delete this feedback entry? This can't be undone.")) return;
    setDeleting(true);
    setDeleteError(null);
    const ok = await remove();
    setDeleting(false);
    if (ok) {
      navigate("/feedback");
    } else {
      setDeleteError("Couldn't delete this entry. Check your connection and try again.");
    }
  };

  const handleStatusChange = async (next: FeedbackStatus) => {
    setStatusSaving(true);
    setStatusError(null);
    const ok = await updateStatus(next);
    setStatusSaving(false);
    if (!ok) setStatusError("Couldn't update status. Check your connection and try again.");
  };

  const mobileTitle = state.status === "found" ? `#${state.entry.id} ${state.entry.title}` : "Feedback";

  const editDeleteActions = (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <>
          {locked ? (
            <Button size="sm" variant="outline" className="gap-1.5" disabled>
              <Pencil className="size-3.5" />
              Edit
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to={`/feedback/${idParam}/edit`}>
                <Pencil className="size-3.5" />
                Edit
              </Link>
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            onClick={handleDelete}
            disabled={deleting || locked}
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
        <Link to="/feedback" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← All feedback
        </Link>
        {state.status === "found" && editDeleteActions}
      </header>

      {!isOnline && (
        <OfflineBanner message="You're offline — showing a cached copy, read-only. Reconnect to edit or change status." />
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
            <p className="text-sm font-medium text-foreground">This entry isn't cached for offline viewing.</p>
            <p className="text-sm text-muted-foreground">Reconnect to load it.</p>
          </div>
        )}

        {state.status === "not_found" && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-foreground">This feedback entry doesn&apos;t exist.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              No entry is saved at <code className="rounded bg-muted px-1 py-0.5 text-xs">/feedback/{idParam}</code>.
            </p>
            <Button asChild className="mt-2 gap-1.5 bg-cherry text-primary-foreground hover:bg-cherry-bright">
              <Link to="/feedback">Back to all feedback</Link>
            </Button>
          </div>
        )}

        {state.status === "found" && (
          <article>
            {state.fromCache && (
              <p className="mb-3 text-xs font-medium text-amber-600 dark:text-amber-400">Showing a cached copy.</p>
            )}
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>#{state.entry.id}</span>
            </div>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {state.entry.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Badge {...typeBadge(state.entry.type)} />

              {isOnline && !locked ? (
                <select
                  value={state.entry.status}
                  onChange={(event) => void handleStatusChange(event.target.value as FeedbackStatus)}
                  disabled={statusSaving}
                  aria-label="Status"
                  className={
                    "rounded-full border-none px-2 py-0.5 text-[11px] font-medium outline-none transition-colors disabled:cursor-wait disabled:opacity-70 " +
                    statusBadge(state.entry.status).tone
                  }
                >
                  {FEEDBACK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusBadge(s).label}
                    </option>
                  ))}
                </select>
              ) : (
                <Badge {...statusBadge(state.entry.status)} />
              )}

              <Badge {...priorityBadge(state.entry.priority)} />

              {state.entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground"
                >
                  {tag}
                </span>
              ))}
              <span className="ml-1 text-xs text-muted-foreground">
                Updated {formatRelativeTime(state.entry.updated_at)}
              </span>

              {state.entry.job_status === "running" && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                  {state.entry.job_stage ? JOB_STAGE_LABEL[state.entry.job_stage] : "Job"} running
                  {state.entry.job_id ? ` · ${state.entry.job_id.slice(0, 8)}` : ""}
                </span>
              )}
              {state.entry.job_status === "failed" && (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                  {state.entry.job_stage ? JOB_STAGE_LABEL[state.entry.job_stage] : "Job"} failed
                  {state.entry.job_error ? `: ${state.entry.job_error}` : ""}
                </span>
              )}
            </div>

            {isOnline && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleRunJob("triage")}
                  disabled={locked || jobActionPending !== null}
                >
                  {jobActionPending === "triage" ? "Starting…" : "Re-run triage"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleRunJob("investigate")}
                  disabled={locked || jobActionPending !== null}
                >
                  {jobActionPending === "investigate" ? "Starting…" : "Investigate"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleRunJob("plan")}
                  disabled={locked || jobActionPending !== null}
                >
                  {jobActionPending === "plan" ? "Starting…" : "Plan"}
                </Button>
              </div>
            )}

            {statusError && <p className="mt-2 text-sm text-destructive">{statusError}</p>}
            {jobActionError && <p className="mt-2 text-sm text-destructive">{jobActionError}</p>}
            {deleteError && <p className="mt-3 text-sm text-destructive">{deleteError}</p>}

            <Section title="Description" content={state.entry.body} />
            <Section title="Investigation" content={state.entry.investigation} />
            <Section title="Implementation Plan" content={state.entry.plan} />

            <div className="mt-8 md:hidden">{editDeleteActions}</div>
          </article>
        )}
      </div>
    </AppFrame>
  );
}
