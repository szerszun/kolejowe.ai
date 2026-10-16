import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { AboutButton } from "./AboutButton";
import { FeedbackButton } from "./FeedbackButton";

export function Header() {
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <button type="button" className="app-header-logo app-header-logo--link" onClick={() => navigate("/")}>
          kolejowe.ai
        </button>
        <span className="app-header-subtitle">{t("appSubtitle")}</span>
      </div>
      <div className="app-header-actions">
        <AboutButton />
        <FeedbackButton />
        <button
          type="button"
          className="lang-toggle"
          onClick={() => setLanguage(language === "pl" ? "en" : "pl")}
          aria-label={t("langToggleAria")}
        >
          {t("langToggle")}
        </button>
      </div>
    </header>
  );
}
