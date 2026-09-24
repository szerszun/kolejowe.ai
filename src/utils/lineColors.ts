import { lines } from "../data/lines";

// A qualitative palette with 20 mutually distinguishable hues -- one per
// line, so every line on the map/sidebar is identifiable at a glance
// instead of several lines sharing one status colour. No yellows: the
// basemap's beige/cream background and green parkland make pale or
// yellow-ish hues hard to pick out.
const PALETTE = [
  "#4E79A7",
  "#F28E2B",
  "#59A14F",
  "#B07AA1",
  "#76B7B2",
  "#E15759",
  "#9C755F",
  "#5B4FE9",
  "#3A9D8F",
  "#D6568C",
  "#1B9E77",
  "#7570B3",
  "#C0392B",
  "#2C7FB8",
  "#8E44AD",
  "#D35400",
  "#16A085",
  "#00838F",
  "#5D4037",
  "#34495E",
];

const LINE_COLORS: Record<string, string> = Object.fromEntries(
  lines.map((line, i) => [line.id, PALETTE[i % PALETTE.length]]),
);

export function getLineColor(lineId: string): string {
  return LINE_COLORS[lineId] ?? "#374151";
}
