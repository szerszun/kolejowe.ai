import { useI18n } from "../i18n/I18nContext";

export function Header() {
  const { t, language, setLanguage } = useI18n();
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <span className="app-header-logo">kolejowe.ai</span>
        <span className="app-header-subtitle">{t("appSubtitle")}</span>
      </div>
      <button
        type="button"
        className="lang-toggle"
        onClick={() => setLanguage(language === "pl" ? "en" : "pl")}
        aria-label="Toggle language"
      >
        {t("langToggle")}
      </button>
    </header>
  );
}
