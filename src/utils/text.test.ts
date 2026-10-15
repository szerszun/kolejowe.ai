import { describe, expect, it } from "vitest";
import { normalize } from "./text";

describe("normalize", () => {
  it("[CRITICAL] regression: strips Polish diacritics including ł, which has no NFD decomposition", () => {
    // "ł" doesn't decompose under NFD like other Polish diacritics do -- this was a real bug
    // where searching "Kol" failed to match "Kołobrzeg" until ł got an explicit replace.
    expect(normalize("Kołobrzeg")).toContain("kol");
    expect(normalize("Łódź")).toBe(normalize("lodz"));
  });

  it("strips other Polish diacritics via NFD", () => {
    expect(normalize("Wrocław Główny")).toBe(normalize("wroclaw glowny"));
    expect(normalize("Świdnica")).toBe(normalize("swidnica"));
    expect(normalize("Żagań")).toBe(normalize("zagan"));
  });

  it("lowercases", () => {
    expect(normalize("WARSZAWA")).toBe(normalize("warszawa"));
  });

  it("a search prefix normalizes to a substring of the full normalized name", () => {
    const query = normalize("Kol");
    const target = normalize("Kołobrzeg");
    expect(target.includes(query)).toBe(true);
  });
});
