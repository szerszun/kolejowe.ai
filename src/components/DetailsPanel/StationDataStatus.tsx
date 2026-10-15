import { useI18n } from "../../i18n/I18nContext";

interface StationDataStatusProps {
  loading: boolean;
  error: boolean;
}

/** Shared loading/error placeholder for the station detail tabs -- distinguishes "still fetching" and
 * "backend unreachable" from a genuinely empty result, which the caller renders itself. */
export function StationDataStatus({ loading, error }: StationDataStatusProps) {
  const { t } = useI18n();

  if (loading) return <p className="empty-state">{t("stationDetailsLoading")}</p>;
  if (error) return <p className="empty-state empty-state--error">{t("stationDetailsError")}</p>;
  return null;
}
