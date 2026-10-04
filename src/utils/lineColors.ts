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
  "#8D6E63",
  "#546E7A",
  "#EF6C00",
  "#6A1B9A",
  "#00695C",
  "#AD1457",
  "#33691E",
  "#4527A0",
  "#BF360C",
  "#01579B",
  "#827717",
  "#4A148C",
  "#004D40",
  "#880E4F",
  "#3E2723",
  "#1A237E",
  "#B71C1C",
  "#33A6B8",
  "#6D4C41",
  "#558B2F",
  "#7B1FA2",
  "#009688",
  "#C2185B",
  "#5D4E37",
  "#37474F",
];

// Deterministic hash instead of a file-order index so a color doesn't
// depend on having the full `lines` list loaded (or its order) -- needed
// once lines come from an async API fetch rather than a static import.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getLineColor(lineId: string): string {
  if (!lineId) return "#374151";
  return PALETTE[hashString(lineId) % PALETTE.length];
}
