import { useEffect, useState } from "react";
import type { StationDetails } from "../types";
import { fetchStationDetails } from "../lib/payloadClient";

interface UseStationDetailsResult {
  details: StationDetails | undefined;
  loading: boolean;
  /** True when the fetch itself failed (backend unreachable / errored) -- distinct from the backend
   * responding normally with no details for this station. */
  error: boolean;
}

export function useStationDetails(stationId: string | null): UseStationDetailsResult {
  const [details, setDetails] = useState<StationDetails | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!stationId) {
      setDetails(undefined);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchStationDetails(stationId)
      .then((data) => {
        if (!cancelled) setDetails(data ?? undefined);
      })
      .catch(() => {
        if (!cancelled) {
          setDetails(undefined);
          setError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { details, loading, error };
}
