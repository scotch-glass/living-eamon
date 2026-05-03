// ============================================================
// Sprint G3 — Eivissa weather cache
//
// Shared logic used by both:
//   app/api/world-weather/route.ts  (GET endpoint for external callers)
//   app/api/chat/route.ts           (called on every player request)
//
// Reads from / writes to the single-row `weather_cache` table.
// Fetches from Open-Meteo when cache is stale (>30 min).
// Falls back to stale cache, then to "sunny" if no cache exists.
// ============================================================

import { serviceClient } from "../supabase";
import { wmoCodeToWeatherKind } from "./weatherDescriptions";
import type { WeatherKind } from "./weatherDescriptions";

export interface WeatherSnapshot {
  kind: WeatherKind;
  temp: number;
  fetchedAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const EIVISSA_LAT = 38.91;
const EIVISSA_LON = 1.43;
const FALLBACK: WeatherSnapshot = { kind: "sunny", temp: 20, fetchedAt: 0 };

async function readCache(): Promise<WeatherSnapshot | null> {
  const { data, error } = await serviceClient
    .from("weather_cache")
    .select("kind, temp, fetched_at")
    .eq("id", 1)
    .single();
  if (error || !data) return null;
  return {
    kind: data.kind as WeatherKind,
    temp: Number(data.temp),
    fetchedAt: Number(data.fetched_at),
  };
}

async function writeCache(snap: WeatherSnapshot): Promise<void> {
  await serviceClient
    .from("weather_cache")
    .upsert(
      { id: 1, kind: snap.kind, temp: snap.temp, fetched_at: snap.fetchedAt },
      { onConflict: "id" }
    );
}

async function fetchOpenMeteo(): Promise<WeatherSnapshot | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${EIVISSA_LAT}&longitude=${EIVISSA_LON}` +
      `&current=weathercode,temperature_2m,wind_speed_10m` +
      `&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      current?: {
        weathercode?: number;
        temperature_2m?: number;
        wind_speed_10m?: number;
      };
    };
    const c = json.current;
    if (!c || c.weathercode == null) return null;
    const kind = wmoCodeToWeatherKind(c.weathercode, c.wind_speed_10m ?? 0);
    const temp = Math.round(c.temperature_2m ?? 20);
    return { kind, temp, fetchedAt: Date.now() };
  } catch {
    return null;
  }
}

/**
 * Returns a fresh (or freshly-refreshed) WeatherSnapshot.
 * Safe to call on every chat request — cheap when cache is warm.
 */
export async function getOrRefreshWeather(): Promise<WeatherSnapshot> {
  const cached = await readCache();

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  const fresh = await fetchOpenMeteo();
  if (fresh) {
    await writeCache(fresh);
    return fresh;
  }

  if (cached) {
    console.warn("[weather] Open-Meteo unavailable; using stale cache");
    return cached;
  }

  console.warn("[weather] Open-Meteo unavailable and no cache; defaulting to sunny");
  return FALLBACK;
}
