import { describe, expect, it } from "vitest";
import { parseContentDate } from "./contentDate";

describe("parseContentDate", () => {
  it("parses date-only strings at midnight UTC", () => {
    expect(parseContentDate("2025-07-25").toISOString()).toBe("2025-07-25T00:00:00.000Z");
  });

  it("normalizes parsed YAML Date objects to a date-only UTC value", () => {
    const parsed = new Date("2025-07-25T05:00:00.000Z");
    expect(parseContentDate(parsed).toISOString()).toBe("2025-07-25T00:00:00.000Z");
  });

  it("rejects an invalid Date object", () => {
    expect(() => parseContentDate(new Date(Number.NaN))).toThrow("Invalid Date object");
  });

  it.each(["July 25, 2025", "2025/07/25", "2025-02-29", "not-a-date"])(
    "rejects ambiguous or invalid input %s",
    (value) => {
      expect(() => parseContentDate(value)).toThrow();
    },
  );
});
