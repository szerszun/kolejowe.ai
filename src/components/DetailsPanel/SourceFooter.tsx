import { useI18n } from "../../i18n/I18nContext";
import type { SourceRef } from "../../types";

export function SourceFooter({ source }: { source: SourceRef }) {
  const { t } = useI18n();
  return (
    <p className="source-footer">
      {t("source")}:{" "}
      {source.url ? (
        <a href={source.url} target="_blank" rel="noreferrer">
          {source.label}
        </a>
      ) : (
        source.label
      )}
      {" · "}
      {t("lastUpdated")}: {source.lastUpdated}
    </p>
  );
}
