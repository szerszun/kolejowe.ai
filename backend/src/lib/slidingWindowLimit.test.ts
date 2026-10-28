import { describe, expect, it } from "vitest";
import { slidingWindowLimit } from "./slidingWindowLimit";

describe("slidingWindowLimit", () => {
  it("allows up to max hits, then refuses", () => {
    const tryHit = slidingWindowLimit(3, 1000, () => 0);
    expect([tryHit(), tryHit(), tryHit(), tryHit()]).toEqual([true, true, true, false]);
  });

  it("allows hits again once the oldest ones leave the window", () => {
    let t = 0;
    const tryHit = slidingWindowLimit(2, 1000, () => t);
    tryHit();
    t = 500;
    tryHit();
    t = 999;
    expect(tryHit()).toBe(false);
    t = 1000; // the hit at 0 is now a full window old
    expect(tryHit()).toBe(true);
    expect(tryHit()).toBe(false); // the hit at 500 is still inside
  });

  it("doesn't count refused hits", () => {
    let t = 0;
    const tryHit = slidingWindowLimit(1, 1000, () => t);
    tryHit();
    t = 600;
    expect(tryHit()).toBe(false);
    t = 1000;
    expect(tryHit()).toBe(true);
  });
});
