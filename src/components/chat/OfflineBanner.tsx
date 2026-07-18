import { CloudOff } from "lucide-react";

interface OfflineBannerProps {
  message?: string;
}

export function OfflineBanner({
  message = "You're offline — showing cached conversations. Replies resume when you reconnect.",
}: OfflineBannerProps) {
  return (
    <div
      role="status"
      className="flex animate-fade-in items-center justify-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300"
    >
      <CloudOff className="size-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
