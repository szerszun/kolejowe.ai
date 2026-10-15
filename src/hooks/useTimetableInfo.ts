import { useEffect, useState } from "react";
import type { TimetableInfo } from "../types";
import { fetchTimetableInfo } from "../lib/payloadClient";

export function useTimetableInfo(): TimetableInfo | undefined {
  const [info, setInfo] = useState<TimetableInfo | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    // fetchTimetableInfo never rejects -- void documents that this is a deliberate
    // fire-and-forget from a non-async effect, not an overlooked await.
    void fetchTimetableInfo().then((data) => {
      if (!cancelled) setInfo(data ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}
