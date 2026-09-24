import type { LineStatus } from "../types";
import type { TranslationKey } from "../i18n/translations";

export const STATUS_COLORS: Record<LineStatus, string> = {
  active_passenger: "#2E7D32", // green
  freight_only: "#8D6E63", // brown
  planned: "#5B4FE9", // brand purple
  closed: "#9E9E9E", // grey
};

export const STATUS_LABEL_KEY: Record<LineStatus, TranslationKey> = {
  active_passenger: "statusActivePassenger",
  freight_only: "statusFreightOnly",
  planned: "statusPlanned",
  closed: "statusClosed",
};

export const ALL_STATUSES: LineStatus[] = ["active_passenger", "freight_only", "planned", "closed"];
