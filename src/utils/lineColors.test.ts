import { describe, expect, it } from "vitest";
import { getContrastingTextColor, getLineColor } from "./lineColors";

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

// WCAG relative luminance / contrast ratio, reimplemented independently of the
// module under test so this doesn't just assert "the function agrees with itself".
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

describe("getLineColor", () => {
  it("returns the fallback grey for an empty line id", () => {
    expect(getLineColor("")).toBe("#374151");
  });

  it("is deterministic -- the same line id always maps to the same color", () => {
    expect(getLineColor("274")).toBe(getLineColor("274"));
  });

  it("gives different lines different colors (not every id collapsing to one hue)", () => {
    const colors = new Set(["274", "275", "137", "273", "285", "292"].map(getLineColor));
    expect(colors.size).toBeGreaterThan(1);
  });

  it("always returns a valid hex color from the palette", () => {
    expect(getLineColor("931")).toMatch(HEX_COLOR);
  });
});

describe("getContrastingTextColor", () => {
  it("returns a valid hex color", () => {
    expect(getContrastingTextColor("#4E79A7")).toMatch(HEX_COLOR);
  });

  it("regression: every color getLineColor can actually produce passes WCAG AA (4.5:1) against the text color it picks -- a fixed white badge text, the bug this function replaced, failed this for ~8 of the palette's mid-brightness colors", () => {
    const backgrounds = new Set(Array.from({ length: 300 }, (_, i) => getLineColor(String(i))));
    expect(backgrounds.size).toBeGreaterThan(10); // sanity: actually sampled a good chunk of the palette

    for (const bg of backgrounds) {
      const textColor = getContrastingTextColor(bg);
      expect(contrastRatio(bg, textColor), `${bg} -> ${textColor}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});
