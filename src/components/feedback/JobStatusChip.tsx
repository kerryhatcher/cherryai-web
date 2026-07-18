import { JOB_STAGE_LABEL } from "@/lib/feedbackBadges";
import type { FeedbackJobStage, FeedbackJobStatus } from "@/types";

interface JobStatusChipProps {
  stage: FeedbackJobStage | null;
  status: FeedbackJobStatus;
  jobId: string | null;
  error: string | null;
}

/** Shared "{Stage} running · {job id}" / "{Stage} failed: {error}" chip — used on both the
 * details view and the locked-editor notice so the lock reads identically in both places. */
export function JobStatusChip({ stage, status, jobId, error }: JobStatusChipProps) {
  const label = stage ? JOB_STAGE_LABEL[stage] : "Job";

  if (status === "running") {
    return (
      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
        {label} running{jobId ? ` · ${jobId.slice(0, 8)}` : ""}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
      {label} failed{error ? `: ${error}` : ""}
    </span>
  );
}
