import { describe, expect, it } from "vitest";
import { cn, isEmpty, formatNumber, formatDate, shuffleArray, diff } from "./helpers";

describe("cn", () => {
  it("merges tailwind classes without conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", true && "block")).toBe("base block");
  });

  it("filters out falsy values", () => {
    expect(cn("a", null, undefined, "", "b")).toBe("a b");
  });
});

describe("isEmpty", () => {
  it("returns true for null and undefined", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it("returns true for empty string", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("   ")).toBe(true);
  });

  it("returns false for non-empty string", () => {
    expect(isEmpty("hello")).toBe(false);
  });

  it("returns true for empty array", () => {
    expect(isEmpty([])).toBe(true);
  });

  it("returns false for non-empty array", () => {
    expect(isEmpty([1])).toBe(false);
  });

  it("returns true for empty object", () => {
    expect(isEmpty({})).toBe(true);
  });

  it("returns false for non-empty object", () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });

  it("returns true for empty Map and Set", () => {
    expect(isEmpty(new Map())).toBe(true);
    expect(isEmpty(new Set())).toBe(true);
  });

  it("returns false for number 0 and boolean false", () => {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(false)).toBe(false);
  });
});

describe("formatNumber", () => {
  it("formats thousands with k suffix", () => {
    expect(formatNumber(1500)).toBe("1.5k");
    expect(formatNumber(1000)).toBe("1k");
  });

  it("formats millions with m suffix", () => {
    expect(formatNumber(2500000)).toBe("2.5m");
  });

  it("formats billions with b suffix", () => {
    expect(formatNumber(3000000000)).toBe("3b");
  });

  it("returns plain number when below 1k", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("handles negative numbers", () => {
    expect(formatNumber(-1500)).toBe("-1.5k");
  });

  it("respects decimals option", () => {
    expect(formatNumber(1234, { decimals: 2 })).toBe("1.23k");
  });

  it("respects forceDecimals option", () => {
    expect(formatNumber(1000, { forceDecimals: true, decimals: 2 })).toBe("1.00k");
  });

  it("respects uppercase option", () => {
    expect(formatNumber(1000, { uppercase: true })).toBe("1K");
  });
});

describe("formatDate", () => {
  it("formats a valid date string", () => {
    // Use a Date object to avoid timezone ambiguity from string parsing
    const result = formatDate(new Date(2024, 5, 15, 12, 0, 0), "en-US");
    expect(result).toMatch(/June 15, 2024/);
  });

  it("formats a Date object", () => {
    expect(formatDate(new Date(2024, 5, 15, 12, 0, 0), "en-US")).toMatch(/June 15, 2024/);
  });

  it("returns empty string for falsy input", () => {
    expect(formatDate("")).toBe("");
  });

  it("throws for invalid date", () => {
    expect(() => formatDate("invalid")).toThrow("Invalid date input");
  });

  it("uses custom locale", () => {
    const result = formatDate(new Date(2024, 5, 15, 12, 0, 0), "id-ID");
    expect(result).toMatch(/15 Juni 2024/);
  });
});

describe("shuffleArray", () => {
  it("returns a new array with the same elements", () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(original);
    expect(shuffled).toHaveLength(original.length);
    expect(shuffled.sort()).toEqual(original.sort());
  });

  it("does not mutate the original array", () => {
    const original = [1, 2, 3];
    shuffleArray(original);
    expect(original).toEqual([1, 2, 3]);
  });

  it("handles empty arrays", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("handles single-element arrays", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

describe("diff", () => {
  it("returns absolute difference", () => {
    expect(diff(10, 5)).toBe(5);
    expect(diff(5, 10)).toBe(5);
  });

  it("rounds inputs before diffing", () => {
    expect(diff(10.4, 5.6)).toBe(4);
    expect(diff(10.6, 5.4)).toBe(6);
  });

  it("returns 0 for equal numbers", () => {
    expect(diff(7, 7)).toBe(0);
  });
});
