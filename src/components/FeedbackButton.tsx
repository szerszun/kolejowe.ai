import { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { submitFeedback } from "../lib/payloadClient";

type SendState = "idle" | "sending" | "success" | "error";

export function FeedbackButton() {
  const { t, language } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SendState>("idle");

  const close = () => {
    setIsOpen(false);
    setMessage("");
    setState("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || state === "sending") return;
    setState("sending");
    try {
      await submitFeedback({ message: message.trim(), page: window.location.pathname, language });
      setState("success");
    } catch {
      setState("error");
    }
  };

  return (
    <>
      <button
        type="button"
        className="feedback-toggle"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        {t("feedbackButton")}
      </button>

      {isOpen && (
        <div className="feedback-modal-overlay" role="presentation" onClick={close}>
          <div
            className="feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("feedbackModalTitle")}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{t("feedbackModalTitle")}</h3>

            {state === "success" ? (
              <>
                <p className="feedback-success">{t("feedbackSuccess")}</p>
                <div className="feedback-modal-actions">
                  <button type="button" className="feedback-cancel" onClick={close}>
                    {t("feedbackCancel")}
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  className="feedback-textarea"
                  placeholder={t("feedbackPlaceholder")}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  autoFocus
                  disabled={state === "sending"}
                />
                {state === "error" && <p className="feedback-error">{t("feedbackError")}</p>}
                <div className="feedback-modal-actions">
                  <button type="button" className="feedback-cancel" onClick={close} disabled={state === "sending"}>
                    {t("feedbackCancel")}
                  </button>
                  <button type="submit" className="feedback-send" disabled={!message.trim() || state === "sending"}>
                    {state === "sending" ? t("feedbackSending") : t("feedbackSend")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
