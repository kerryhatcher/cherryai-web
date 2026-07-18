import { useCallback, useEffect, useRef, useState } from "react";
import { getHealth } from "@/api/client";

const POLL_INTERVAL_MS = 10_000;

export interface ApiStatus {
  isOnline: boolean;
  retry: () => Promise<void>;
}

/** Tracks API reachability via an initial health check plus polling while offline. */
export function useApiStatus(): ApiStatus {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const check = useCallback(async () => {
    try {
      await getHealth();
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    if (isOnline) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = window.setInterval(check, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    };
  }, [isOnline, check]);

  return { isOnline, retry: check };
}
