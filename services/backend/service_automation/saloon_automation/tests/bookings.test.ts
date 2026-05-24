import { describe, expect, it } from "vitest";
import {
  extractBooking,
  normalizeDate,
  normalizeTime,
} from "@/segments/salon/bookings";
import { BOOKING_MARKER } from "@/segments/salon/prompt";

describe("normalizeDate", () => {
  it("accepts canonical YYYY-MM-DD", () => {
    expect(normalizeDate("2026-03-15")).toBe("2026-03-15");
  });
  it.each([
    ["2026/03/15", "2026-03-15"],
    ["2026.3.5", "2026-03-05"],
    ["2026-3-5", "2026-03-05"],
  ])("accepts variant %s", (input, expected) => {
    expect(normalizeDate(input)).toBe(expected);
  });
  it.each(["flexible", "tbd", "", "next week", "15-03-2026", "2026-13-01", "2026-02-32"])(
    "rejects %s",
    (input) => {
      expect(normalizeDate(input)).toBeNull();
    },
  );
});

describe("normalizeTime", () => {
  it("accepts HH:MM 24h", () => {
    expect(normalizeTime("14:30")).toBe("14:30");
  });
  it("zero-pads single digit hours", () => {
    expect(normalizeTime("9:05")).toBe("09:05");
  });
  it.each([
    ["4pm", "16:00"],
    ["4:30pm", "16:30"],
    ["11am", "11:00"],
    ["12am", "00:00"],
    ["12pm", "12:00"],
    ["11:00 a.m.", "11:00"],
  ])("converts %s to 24h", (input, expected) => {
    expect(normalizeTime(input)).toBe(expected);
  });
  it.each(["flexible", "", "25:00", "10:99", "thirteen", "4xm"])(
    "rejects %s",
    (input) => {
      expect(normalizeTime(input)).toBeNull();
    },
  );
});

describe("extractBooking", () => {
  it("returns the original text when there is no marker", () => {
    const { cleanText, booking } = extractBooking("hello");
    expect(cleanText).toBe("hello");
    expect(booking).toBeNull();
  });

  it("strips the marker line and parses fields", () => {
    const reply = `Got it, see you then!
${BOOKING_MARKER} name=Priya; service=highlights; date=2026-04-12; time=15:00; notes=allergic to ammonia`;
    const { cleanText, booking } = extractBooking(reply);
    expect(cleanText).toBe("Got it, see you then!");
    expect(booking).toEqual({
      name: "Priya",
      service: "highlights",
      date: "2026-04-12",
      time: "15:00",
      notes: "allergic to ammonia",
    });
  });

  it("treats 'flexible' as null for date/time", () => {
    const reply = `${BOOKING_MARKER} name=A; service=cut; date=flexible; time=flexible`;
    const { booking } = extractBooking(reply);
    expect(booking?.date).toBeNull();
    expect(booking?.time).toBeNull();
  });

  it("returns no booking when required fields are missing", () => {
    const reply = `Sure!\n${BOOKING_MARKER} name=; service=`;
    const { cleanText, booking } = extractBooking(reply);
    expect(cleanText).toBe("Sure!");
    expect(booking).toBeNull();
  });

  it("handles a marker line with no trailing newline", () => {
    const reply = `${BOOKING_MARKER} name=Sam; service=cut; date=2026-05-01`;
    const { cleanText, booking } = extractBooking(reply);
    expect(cleanText).toBe("");
    expect(booking?.name).toBe("Sam");
    expect(booking?.date).toBe("2026-05-01");
  });
});
