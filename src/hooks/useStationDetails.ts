import { useEffect, useState } from "react";
import type { StationDetails } from "../types";
import { fetchStationDetails } from "../lib/payloadClient";

interface UseStationDetailsResult {
  details: StationDetails | undefined;
  loading: boolean;
}

export function useStationDetails(stationId: string | null): UseStationDetailsResult {
  const [details, setDetails] = useState<StationDetails | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stationId) {
      setDetails(undefined);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchStationDetails(stationId)
      .then((data) => {
        if (!cancelled) setDetails(data ?? undefined);
      })
      .catch(() => {
        if (!cancelled) setDetails(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { details, loading };
}
