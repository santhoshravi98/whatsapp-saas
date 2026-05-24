import { describe, expect, it } from "vitest";
import {
  extractInteractive,
  INTERACTIVE_MARKER,
  LIMITS,
} from "@/segments/salon/interactive";

const BUTTONS_OK = {
  kind: "buttons",
  body: "Want me to book this?",
  buttons: [
    { id: "confirm", title: "Confirm" },
    { id: "change",  title: "Change" },
    { id: "cancel",  title: "Cancel" },
  ],
};

const LIST_OK = {
  kind: "list",
  body: "Which service?",
  buttonText: "Browse",
  sections: [
    {
      title: "Hair",
      rows: [
        { id: "haircut", title: "Haircut", description: "Wash + cut" },
        { id: "colour",  title: "Colour" },
      ],
    },
  ],
};

function withMarker(prefix: string, payload: unknown): string {
  return `${prefix}\n${INTERACTIVE_MARKER} ${JSON.stringify(payload)}`;
}

describe("extractInteractive", () => {
  it("returns no interactive when marker is absent", () => {
    const r = extractInteractive("just a chatty reply");
    expect(r.cleanText).toBe("just a chatty reply");
    expect(r.interactive).toBeNull();
  });

  it("parses a buttons marker and strips the line", () => {
    const r = extractInteractive(withMarker("Sure!", BUTTONS_OK));
    expect(r.cleanText).toBe("Sure!");
    expect(r.interactive?.kind).toBe("buttons");
    if (r.interactive?.kind === "buttons") {
      expect(r.interactive.payload.buttons).toHaveLength(3);
      expect(r.interactive.payload.buttons[0]).toEqual({ id: "confirm", title: "Confirm" });
    }
  });

  it("parses a list marker and strips the line", () => {
    const r = extractInteractive(withMarker("Here you go:", LIST_OK));
    expect(r.cleanText).toBe("Here you go:");
    expect(r.interactive?.kind).toBe("list");
    if (r.interactive?.kind === "list") {
      expect(r.interactive.payload.sections[0]?.rows).toHaveLength(2);
    }
  });

  it("handles a marker with no trailing newline", () => {
    const reply = `${INTERACTIVE_MARKER} ${JSON.stringify(BUTTONS_OK)}`;
    const r = extractInteractive(reply);
    expect(r.cleanText).toBe("");
    expect(r.interactive?.kind).toBe("buttons");
  });

  it("drops the marker but returns no interactive when JSON is malformed", () => {
    const reply = `Hi.\n${INTERACTIVE_MARKER} {not valid json`;
    const r = extractInteractive(reply);
    expect(r.cleanText).toBe("Hi.");
    expect(r.interactive).toBeNull();
  });

  it("rejects a buttons payload with more than 3 buttons", () => {
    const bad = {
      ...BUTTONS_OK,
      buttons: Array.from({ length: 4 }, (_, i) => ({ id: `b${i}`, title: `B${i}` })),
    };
    const r = extractInteractive(withMarker("ok", bad));
    expect(r.interactive).toBeNull();
  });

  it("rejects a list with more than 10 total rows", () => {
    const tooMany = {
      ...LIST_OK,
      sections: [
        {
          title: "Hair",
          rows: Array.from({ length: 11 }, (_, i) => ({ id: `r${i}`, title: `T${i}` })),
        },
      ],
    };
    const r = extractInteractive(withMarker("ok", tooMany));
    expect(r.interactive).toBeNull();
  });

  it("rejects button titles longer than the Meta limit", () => {
    const bad = {
      ...BUTTONS_OK,
      buttons: [{ id: "x", title: "x".repeat(LIMITS.BUTTON_TITLE + 1) }],
    };
    const r = extractInteractive(withMarker("ok", bad));
    expect(r.interactive).toBeNull();
  });

  it("rejects an unknown kind", () => {
    const bad = { kind: "carousel", body: "x", items: [] };
    const r = extractInteractive(withMarker("ok", bad));
    expect(r.interactive).toBeNull();
  });

  it("requires at least one row per section", () => {
    const bad = { ...LIST_OK, sections: [{ title: "Hair", rows: [] }] };
    const r = extractInteractive(withMarker("ok", bad));
    expect(r.interactive).toBeNull();
  });
});
