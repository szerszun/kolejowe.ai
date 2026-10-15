import { useEffect, useState } from "react";
import type { LiveMovement, LiveMovementsUnavailableReason } from "../types";
import { fetchLiveMovements } from "../lib/payloadClient";

const POLL_INTERVAL_MS = 60_000;

interface UseLiveMovementsResult {
  /** undefined while loading or unknown; null once confirmed unavailable for this station. */
  movements: LiveMovement[] | null | undefined;
  /** Set exactly when movements is null -- see LiveMovementsUnavailableReason. */
  reason: LiveMovementsUnavailableReason | null;
}

/** Polls the live PKP PLK feed for a station while `enabled` and the tab is visible. */
export function useLiveMovements(stationId: string | null, enabled: boolean): UseLiveMovementsResult {
  const [movements, setMovements] = useState<LiveMovement[] | null | undefined>(undefined);
  const [reason, setReason] = useState<LiveMovementsUnavailableReason | null>(null);

  useEffect(() => {
    if (!stationId || !enabled) {
      setMovements(undefined);
      setReason(null);
      return;
    }

    let cancelled = false;

    const load = () => {
      fetchLiveMovements(stationId).then((result) => {
        if (cancelled) return;
        setMovements(result.movements);
        setReason(result.reason);
      });
    };

    // Always load immediately -- enabling live mode is a deliberate user
    // action, so it shouldn't be skipped just because the tab happens to
    // be backgrounded at that exact moment. Only the recurring poll (where
    // skipping saves API quota for no visible benefit) checks visibility.
    load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [stationId, enabled]);

  return { movements, reason };
}
