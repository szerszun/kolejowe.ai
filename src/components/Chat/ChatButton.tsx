import { useI18n } from "../../i18n/I18nContext";

export function ChatButton({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="chat-fab" onClick={onClick} aria-label={t("chatOpen")}>
      💬
    </button>
  );
}
