import { useState } from "react";
import { useI18n } from "../i18n/I18nContext";

export function AboutButton() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const close = () => setIsOpen(false);

  return (
    <>
      <button type="button" className="about-toggle" onClick={() => setIsOpen(true)} aria-haspopup="dialog">
        {t("aboutButton")}
      </button>

      {isOpen && (
        <div className="feedback-modal-overlay" role="presentation" onClick={close}>
          <div
            className="feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("aboutModalTitle")}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("aboutModalTitle")}</h3>
            <p>{t("aboutIntro")}</p>

            <h4 className="about-section-title">{t("aboutFeaturesTitle")}</h4>
            <ul className="about-feature-list">
              <li>{t("aboutFeature1")}</li>
              <li>{t("aboutFeature2")}</li>
              <li>{t("aboutFeature3")}</li>
              <li>{t("aboutFeature4")}</li>
            </ul>

            <p className="about-disclaimer">{t("aboutDisclaimer")}</p>

            <h4 className="about-section-title">{t("aboutPrivacyTitle")}</h4>
            <p className="about-privacy-text">{t("aboutPrivacyIntro")}</p>
            <ul className="about-feature-list">
              <li>{t("aboutPrivacy1")}</li>
              <li>{t("aboutPrivacy2")}</li>
              <li>{t("aboutPrivacy3")}</li>
              <li>{t("aboutPrivacy4")}</li>
            </ul>
            <p className="about-privacy-text">{t("aboutPrivacyContact")}</p>

            <div className="feedback-modal-actions">
              <button type="button" className="feedback-cancel" onClick={close}>
                {t("aboutClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
