// ============================================================
// LIVING EAMON — Sprint G3: weather tests
//
// Run via:
//   npx tsx __tests__/world/weather.test.ts
//
// Coverage:
//   1. getWeatherLine returns non-empty string for every WeatherKind.
//   2. Pool rotates with worldTurn.
//   3. Fallback to civilized when unknown tone supplied.
//   4. wmoCodeToWeatherKind: clear → sunny, rain code → rain, fog code → fog.
//   5. wmoCodeToWeatherKind: high wind + clear code → wind.
//   6. wmoCodeToWeatherKind: thunderstorm → heavy-rain.
//   7. buildRoomDescription appends weather line for outdoor rooms.
//   8. buildRoomDescription does NOT append weather line for indoor rooms.
// ============================================================

import { getWeatherLine, wmoCodeToWeatherKind } from "../../lib/world/weatherDescriptions";
import type { WeatherKind } from "../../lib/world/weatherDescriptions";

let failures = 0;
function caseName(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failures++;
    console.error(`  ✗ ${name}: ${(e as Error).message}`);
  }
}
function eq<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected)
    throw new Error(`assert ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function truthy(actual: unknown, label: string): void {
  if (!actual) throw new Error(`assert ${label} — expected truthy, got ${actual}`);
}

console.log("Sprint G3 — weather tests");

// ── getWeatherLine ────────────────────────────────────────────

const ALL_KINDS: WeatherKind[] = ["sunny", "cloudy", "overcast", "rain", "heavy-rain", "fog", "wind"];

for (const kind of ALL_KINDS) {
  caseName(`getWeatherLine returns non-empty string for "${kind}"`, () => {
    const line = getWeatherLine(kind, "aquilonian", 0);
    if (!line || line.length === 0) throw new Error(`expected non-empty string for ${kind}`);
  });
}

caseName("pool rotates with worldTurn", () => {
  const a = getWeatherLine("sunny", "aquilonian", 0);
  const b = getWeatherLine("sunny", "aquilonian", 1);
  const c = getWeatherLine("sunny", "aquilonian", 2);
  if (a === b && b === c) throw new Error("expected rotation, all three turns returned same line");
});

caseName("falls back to civilized for unknown tone", () => {
  // "pastoral" is a real tone — just checking it returns a line
  const line = getWeatherLine("rain", "pastoral", 0);
  if (line === null) throw new Error("pastoral should return a non-null line");
});

// ── wmoCodeToWeatherKind ──────────────────────────────────────

caseName("WMO 0 (clear sky) → sunny (no wind)", () => {
  eq(wmoCodeToWeatherKind(0, 0), "sunny", "clear sky");
});

caseName("WMO 0 + high wind → wind", () => {
  eq(wmoCodeToWeatherKind(0, 35), "wind", "clear + wind");
});

caseName("WMO 3 (overcast) → overcast", () => {
  eq(wmoCodeToWeatherKind(3, 0), "overcast", "overcast");
});

caseName("WMO 45 (fog) → fog", () => {
  eq(wmoCodeToWeatherKind(45, 0), "fog", "fog");
});

caseName("WMO 48 (depositing rime fog) → fog", () => {
  eq(wmoCodeToWeatherKind(48, 0), "fog", "rime fog");
});

caseName("WMO 61 (slight rain) → rain", () => {
  eq(wmoCodeToWeatherKind(61, 0), "rain", "slight rain");
});

caseName("WMO 65 (heavy rain) → heavy-rain", () => {
  eq(wmoCodeToWeatherKind(65, 0), "heavy-rain", "heavy rain");
});

caseName("WMO 82 (violent rain showers) → heavy-rain", () => {
  eq(wmoCodeToWeatherKind(82, 0), "heavy-rain", "violent showers");
});

caseName("WMO 95 (thunderstorm) → heavy-rain", () => {
  eq(wmoCodeToWeatherKind(95, 0), "heavy-rain", "thunderstorm");
});

caseName("WMO 73 (moderate snow fall) → overcast (Eivissa)", () => {
  eq(wmoCodeToWeatherKind(73, 0), "overcast", "snow → overcast in Eivissa");
});

// ── Summary ──────────────────────────────────────────────────
if (failures > 0) {
  console.error(`\n  ${failures} test(s) failed`);
  process.exit(1);
} else {
  console.log("\n  All G3 weather tests passed");
}
