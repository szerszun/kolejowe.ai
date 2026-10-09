import { useI18n } from "../../i18n/I18nContext";
import type { TimetableInfo } from "../../types";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" });
}

export function TimetableValidityBanner({ info }: { info: TimetableInfo | undefined }) {
  const { t, language } = useI18n();

  if (!info?.validFrom || !info?.validTo) return null;

  const locale = language === "pl" ? "pl-PL" : "en-GB";
  return (
    <p className="timetable-validity-banner">
      {t("timetableValidity", { from: formatDate(info.validFrom, locale), to: formatDate(info.validTo, locale) })}
    </p>
  );
}
