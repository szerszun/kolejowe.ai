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

// Pure black, not --color-text (#1b1f2b) -- the extra headroom is needed to clear
// 4.5:1 against the palette's mid-brightness entries (verified against all 46 colors).
const DARK_TEXT = "#000000";
const WHITE_TEXT = "#ffffff";

// WCAG relative luminance (https://www.w3.org/TR/WCAG21/#dfn-relative-luminance).
function relativeLuminance(hex: string): number {
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((h) => {
    const c = Number.parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hexA: string, hexB: string): number {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Picks white or dark text for a badge on this background color -- the 45-color
 * palette above was tuned for distinguishability on the map, not for a fixed
 * white-text badge to stay WCAG AA (4.5:1) against every one of them. Whichever
 * of white/dark gives the higher contrast against this specific background wins.
 */
export function getContrastingTextColor(backgroundHex: string): string {
  return contrastRatio(backgroundHex, DARK_TEXT) > contrastRatio(backgroundHex, WHITE_TEXT) ? DARK_TEXT : WHITE_TEXT;
}
