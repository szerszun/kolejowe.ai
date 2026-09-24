import { useI18n } from "../../i18n/I18nContext";
import { ALL_STATUSES, STATUS_COLORS, STATUS_LABEL_KEY } from "../../utils/status";

export function Legend() {
  const { t } = useI18n();
  return (
    <div className="legend" aria-label={t("legend")}>
      <strong className="legend-title">{t("legend")}</strong>
      <ul>
        {ALL_STATUSES.map((status) => (
          <li key={status}>
            <span className="legend-swatch" style={{ backgroundColor: STATUS_COLORS[status] }} aria-hidden />
            {t(STATUS_LABEL_KEY[status])}
          </li>
        ))}
        <li>
          <span className="legend-swatch legend-swatch--dot" aria-hidden />
          {t("filterHasTenders")}
        </li>
      </ul>
    </div>
  );
}
