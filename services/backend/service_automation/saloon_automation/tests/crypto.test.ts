import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { isPayloadFresh, isRawPayloadFresh, verifyMetaSignature } from "@/core/crypto";

const SECRET = "test-secret";

function sign(body: string): string {
  return "sha256=" + crypto.createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
}

describe("verifyMetaSignature", () => {
  it("accepts a correctly signed body", () => {
    const body = '{"entry":[]}';
    expect(verifyMetaSignature(body, sign(body), SECRET)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const body = '{"entry":[]}';
    const tampered = '{"entry":[1]}';
    expect(verifyMetaSignature(tampered, sign(body), SECRET)).toBe(false);
  });

  it("rejects when header is missing", () => {
    expect(verifyMetaSignature("x", null, SECRET)).toBe(false);
  });

  it("rejects when header has wrong prefix", () => {
    const body = "x";
    const hex = crypto.createHmac("sha256", SECRET).update(body, "utf8").digest("hex");
    expect(verifyMetaSignature(body, `sha1=${hex}`, SECRET)).toBe(false);
  });

  it("rejects truncated signature without throwing on timingSafeEqual length mismatch", () => {
    const body = "x";
    const full = sign(body);
    expect(verifyMetaSignature(body, full.slice(0, 20), SECRET)).toBe(false);
  });
});

describe("isPayloadFresh", () => {
  const now = 1_700_000_000;

  it("treats payloads without message timestamps as fresh", () => {
    expect(isPayloadFresh({ entry: [] }, 300, now)).toBe(true);
  });

  it("accepts a recent message timestamp", () => {
    const payload = {
      entry: [{ changes: [{ value: { messages: [{ timestamp: String(now - 60) }] } }] }],
    };
    expect(isPayloadFresh(payload, 300, now)).toBe(true);
  });

  it("rejects a stale message timestamp", () => {
    const payload = {
      entry: [{ changes: [{ value: { messages: [{ timestamp: String(now - 3600) }] } }] }],
    };
    expect(isPayloadFresh(payload, 300, now)).toBe(false);
  });

  it("uses the OLDEST timestamp when multiple are present", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { timestamp: String(now - 10) },
                  { timestamp: String(now - 9999) },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(isPayloadFresh(payload, 300, now)).toBe(false);
  });
});

describe("isRawPayloadFresh", () => {
  it("returns false for non-JSON input", () => {
    expect(isRawPayloadFresh("{not json", 300)).toBe(false);
  });
});
