import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
      <WifiOff className="size-4 shrink-0" />
      <span>
        You&apos;re offline. Showing cached conversations — replies are unavailable
        until you reconnect.
      </span>
    </div>
  );
}
