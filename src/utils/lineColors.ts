import { lines } from "../data/lines";

// A qualitative palette with 10 mutually distinguishable hues -- one per
// sample line, so every line on the map/sidebar is identifiable at a
// glance instead of several lines sharing one status colour.
const PALETTE = [
  "#4E79A7",
  "#F28E2B",
  "#59A14F",
  "#B07AA1",
  "#76B7B2",
  "#EDC948",
  "#E15759",
  "#9C755F",
  "#5B4FE9",
  "#3A9D8F",
];

const LINE_COLORS: Record<string, string> = Object.fromEntries(
  lines.map((line, i) => [line.id, PALETTE[i % PALETTE.length]]),
);

export function getLineColor(lineId: string): string {
  return LINE_COLORS[lineId] ?? "#374151";
}
