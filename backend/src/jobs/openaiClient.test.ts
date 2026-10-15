import { describe, expect, it } from "vitest";
import { extractJsonBlock } from "./openaiClient";

describe("extractJsonBlock", () => {
  it("parses a fenced ```json block", () => {
    const text = "Here you go:\n```json\n{\"a\":1}\n```\nDone.";
    expect(extractJsonBlock<{ a: number }>(text)).toEqual({ a: 1 });
  });

  it("uses the last fenced block when there are several", () => {
    const text = "```json\n{\"a\":1}\n```\nSecond thought:\n```json\n{\"a\":2}\n```";
    expect(extractJsonBlock<{ a: number }>(text)).toEqual({ a: 2 });
  });

  it("throws when no fenced json block is present", () => {
    expect(() => extractJsonBlock("no fences here")).toThrow(/No ```json block/);
  });

  it("tolerates leading/trailing whitespace inside the fence (JSON.parse does, so the regex doesn't need to)", () => {
    const text = "```json\n   {\"a\":1}  \n```";
    expect(extractJsonBlock<{ a: number }>(text)).toEqual({ a: 1 });
  });
});
