import { describe, expect, it } from "vitest";
import { ALL_STATUSES, STATUS_COLORS, STATUS_LABEL_KEY } from "./status";

describe("status lookup tables", () => {
  it("has a color and a label key for every status in ALL_STATUSES", () => {
    for (const status of ALL_STATUSES) {
      expect(STATUS_COLORS[status]).toMatch(/^#[0-9A-F]{6}$/i);
      expect(STATUS_LABEL_KEY[status]).toBeTruthy();
    }
  });

  it("doesn't define colors or labels for statuses outside ALL_STATUSES", () => {
    expect(Object.keys(STATUS_COLORS).sort()).toEqual([...ALL_STATUSES].sort());
    expect(Object.keys(STATUS_LABEL_KEY).sort()).toEqual([...ALL_STATUSES].sort());
  });
});
