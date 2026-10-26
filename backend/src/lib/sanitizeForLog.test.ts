import { describe, expect, it } from "vitest";
import { sanitizeForLog } from "./sanitizeForLog";

describe("sanitizeForLog", () => {
  it("leaves ordinary values untouched", () => {
    expect(sanitizeForLog("83e70791-77c8-44bf-8726-df75c3f34dd4")).toBe("83e70791-77c8-44bf-8726-df75c3f34dd4");
    expect(sanitizeForLog("Kraków Główny")).toBe("Kraków Główny");
  });

  it("replaces line breaks so a value can't forge extra log lines", () => {
    expect(sanitizeForLog("IC 1234\nFAKE: sync succeeded\r\n")).toBe("IC 1234 FAKE: sync succeeded  ");
    expect(sanitizeForLog("a\u2028b\u2029c")).toBe("a b c");
  });

  it("replaces terminal escape and other control characters", () => {
    expect(sanitizeForLog("\u001b[31mred\u001b[0m\u0000")).toBe(" [31mred [0m ");
  });

  it("stringifies non-string values", () => {
    expect(sanitizeForLog(42)).toBe("42");
    expect(sanitizeForLog(null)).toBe("null");
    expect(sanitizeForLog(undefined)).toBe("undefined");
  });
});
