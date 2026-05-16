/**
 * Liveness probe — used by uptime monitoring (UptimeRobot, etc.).
 * Keep this cheap: no DB calls, no LLM calls.
 */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
