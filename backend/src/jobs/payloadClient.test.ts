import { describe, expect, it } from "vitest";
import { summarizeErrorBody } from "./payloadClient";

describe("summarizeErrorBody", () => {
  it("regression: reduces Render's ~100KB HTML 502 page to its title", () => {
    // The first 300 characters of the real page are inline CSS, which is all the
    // summary email used to show.
    const page = `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <title>502</title>\n    <style>@font-face { src: url("data:font/woff2;base64,${"A".repeat(5000)}") }</style>`;
    expect(summarizeErrorBody(page)).toBe('HTML error page "502"');
  });

  it("collapses a plain-text body to one line of at most 300 characters", () => {
    expect(summarizeErrorBody('{"errors":\n  [{"message": "Forbidden"}]}')).toBe('{"errors": [{"message": "Forbidden"}]}');
    expect(summarizeErrorBody("x".repeat(1000))).toHaveLength(300);
  });

  it("handles an empty body", () => {
    expect(summarizeErrorBody("")).toBe("");
  });
});
