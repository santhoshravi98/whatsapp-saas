import { describe, expect, it } from "vitest";
import { assertBudget, TokenBudgetExceededError, type Tenant } from "@/core/tenants";

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Test",
    segment: "salon",
    config: {},
    timezone: "UTC",
    monthlyTokenCap: null,
    monthlyTokensUsed: 0,
    usagePeriodStart: null,
    ...overrides,
  };
}

describe("assertBudget", () => {
  it("allows when no cap is set", () => {
    expect(() => assertBudget(makeTenant())).not.toThrow();
  });

  it("allows when under cap in the active period", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    const tenant = makeTenant({
      monthlyTokenCap: 1_000_000,
      monthlyTokensUsed: 100_000,
      usagePeriodStart: "2026-03-01",
    });
    expect(() => assertBudget(tenant, now)).not.toThrow();
  });

  it("throws when at or over the cap in the active period", () => {
    const now = new Date("2026-03-15T00:00:00Z");
    const tenant = makeTenant({
      monthlyTokenCap: 1_000,
      monthlyTokensUsed: 1_000,
      usagePeriodStart: "2026-03-01",
    });
    expect(() => assertBudget(tenant, now)).toThrow(TokenBudgetExceededError);
  });

  it("resets usage when the period is from a prior month", () => {
    const now = new Date("2026-04-02T00:00:00Z");
    const tenant = makeTenant({
      monthlyTokenCap: 1_000,
      monthlyTokensUsed: 9_999,
      usagePeriodStart: "2026-03-01",
    });
    // Period rolled over -> effective used is 0 -> not throwing.
    expect(() => assertBudget(tenant, now)).not.toThrow();
  });
});
