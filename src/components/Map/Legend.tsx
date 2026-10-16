import { useState } from "react";
import { useI18n } from "../../i18n/I18nContext";
import { ALL_STATUSES, STATUS_LABEL_KEY } from "../../utils/status";

const STATUS_PATTERN_CLASS: Record<(typeof ALL_STATUSES)[number], string> = {
  active_passenger: "legend-swatch--solid",
  freight_only: "legend-swatch--dashed",
  planned: "legend-swatch--dotted",
  closed: "legend-swatch--closed",
};

export function Legend() {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="legend" aria-label={t("legend")}>
      <div className="legend-header">
        <strong className="legend-title">{t("legend")}</strong>
        <button
          type="button"
          className="legend-toggle"
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? t("legendExpand") : t("legendCollapse")}
          onClick={() => setIsCollapsed((c) => !c)}
        >
          {isCollapsed ? "+" : "−"}
        </button>
      </div>
      {!isCollapsed && (
        <>
          <p className="legend-hint">{t("legendColorHint")}</p>
          <ul>
            {ALL_STATUSES.map((status) => (
              <li key={status}>
                <span className={`legend-swatch ${STATUS_PATTERN_CLASS[status]}`} aria-hidden />
                {t(STATUS_LABEL_KEY[status])}
              </li>
            ))}
            <li>
              <span className="legend-swatch legend-swatch--dot" aria-hidden />
              {t("filterHasTenders")}
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
