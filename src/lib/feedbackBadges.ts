import type { FeedbackPriority, FeedbackStatus, FeedbackType } from "@/types";

export interface BadgeTone {
  label: string;
  tone: string;
}

const TYPE_LABEL: Record<FeedbackType, string> = {
  bug: "Bug",
  feature: "Feature",
  user_story: "Story",
};

/** Cherry-Orchard-toned, theme-aware (light + dark via prefers-color-scheme). */
const TYPE_TONE: Record<FeedbackType, string> = {
  bug: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  feature: "bg-cherry/10 text-cherry-deep dark:text-cherry-bright",
  user_story: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  wontfix: "Won't fix",
};

const STATUS_TONE: Record<FeedbackStatus, string> = {
  open: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  resolved: "bg-cherry/10 text-cherry-deep dark:text-cherry-bright",
  closed: "bg-muted text-muted-foreground",
  wontfix: "bg-secondary text-secondary-foreground",
};

const PRIORITY_LABEL: Record<FeedbackPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const PRIORITY_TONE: Record<FeedbackPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  critical: "bg-cherry/15 text-cherry-deep dark:text-cherry-bright",
};

export const typeBadge = (type: FeedbackType): BadgeTone => ({ label: TYPE_LABEL[type], tone: TYPE_TONE[type] });
export const statusBadge = (status: FeedbackStatus): BadgeTone => ({
  label: STATUS_LABEL[status],
  tone: STATUS_TONE[status],
});
export const priorityBadge = (priority: FeedbackPriority): BadgeTone => ({
  label: PRIORITY_LABEL[priority],
  tone: PRIORITY_TONE[priority],
});

export const FEEDBACK_TYPES: FeedbackType[] = ["bug", "feature", "user_story"];
export const FEEDBACK_STATUSES: FeedbackStatus[] = ["open", "in_progress", "resolved", "closed", "wontfix"];
export const FEEDBACK_PRIORITIES: FeedbackPriority[] = ["low", "medium", "high", "critical"];
