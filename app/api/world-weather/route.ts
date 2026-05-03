// ============================================================
// Sprint G3 — Eivissa weather endpoint
//
// GET /api/world-weather
//   Returns the current cached weather (or fetches fresh if stale).
//   Response: { kind: WeatherKind, temp: number, fetchedAt: number }
//
// Logic lives in lib/world/weatherCache.ts (shared with the chat route).
// ============================================================

import { NextResponse } from "next/server";
import { getOrRefreshWeather } from "../../../lib/world/weatherCache";

export type { WeatherSnapshot } from "../../../lib/world/weatherCache";

export async function GET() {
  const snap = await getOrRefreshWeather();
  return NextResponse.json(snap);
}
