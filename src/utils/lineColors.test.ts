import { describe, expect, it } from "vitest";
import { getLineColor } from "./lineColors";

const HEX_COLOR = /^#[0-9A-F]{6}$/i;

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
