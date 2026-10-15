import { describe, expect, it } from "vitest";
import { boundsForCoordinates } from "./geo";

describe("boundsForCoordinates", () => {
  it("returns the min/max corners for several points", () => {
    const coords: [number, number][] = [
      [16.0, 50.0],
      [17.5, 51.2],
      [15.2, 50.8],
    ];
    expect(boundsForCoordinates(coords)).toEqual([
      [15.2, 50.0],
      [17.5, 51.2],
    ]);
  });

  it("collapses to a single point when there's only one coordinate", () => {
    expect(boundsForCoordinates([[16.97, 51.1]])).toEqual([
      [16.97, 51.1],
      [16.97, 51.1],
    ]);
  });

  it("ignores point order -- the result only depends on the extremes", () => {
    const coords: [number, number][] = [
      [17.5, 50.0],
      [15.2, 51.2],
      [16.0, 50.8],
    ];
    const reversed = [...coords].reverse();
    expect(boundsForCoordinates(coords)).toEqual(boundsForCoordinates(reversed));
  });
});
