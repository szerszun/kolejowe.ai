import { useEffect, useState } from "react";
import type { RailwayLine } from "../types";
import { fetchLines, PayloadFetchError } from "../lib/payloadClient";

interface UseLinesResult {
  lines: RailwayLine[];
  loading: boolean;
  error: string | null;
}

export function useLines(): UseLinesResult {
  const [lines, setLines] = useState<RailwayLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchLines()
      .then((data) => {
        if (!cancelled) setLines(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof PayloadFetchError ? err.message : "Failed to load lines.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { lines, loading, error };
}
