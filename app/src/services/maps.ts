import { MAPS } from '../config';
import { apiUrl, hasApi } from './api';

export interface RouteStep {
  instruction: string;
  distanceM: number;
  endLat: number;
  endLng: number;
}

export interface RouteOption {
  id: string;
  label: string;
  etaMin: number;
  distanceKm: number;
  note?: string;
  steps: RouteStep[];
  polyline?: string;
  origin: string;
  destination: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Haversine distance in meters. */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Decode a Google encoded polyline into lat/lng points. */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  while (index < len) {
    let b = 0;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    b = 0;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

/** Fit a map region around a set of points. */
export function regionFor(
  points: LatLng[],
): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null {
  if (!points.length) return null;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.006),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.006),
  };
}

async function directions(origin: string, destination: string, nonce: number): Promise<RouteOption[]> {
  const url =
    'https://maps.googleapis.com/maps/api/directions/json' +
    `?origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    '&mode=walking' +
    '&alternatives=true' +
    `&key=${MAPS.apiKey}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK') {
    throw new Error('Directions API: ' + json.status + (json.error_message ? ' — ' + json.error_message : ''));
  }
  const labels = ['Fastest', 'Alternative', 'Alternative 2'];
  return json.routes.slice(0, 3).map((r: any, i: number) => {
    const leg = r.legs?.[0];
    const steps: RouteStep[] = (leg?.steps ?? []).map((s: any) => ({
      instruction: stripHtml(s.html_instructions ?? 'Continue'),
      distanceM: s.distance?.value ?? 0,
      endLat: s.end_location?.lat ?? 0,
      endLng: s.end_location?.lng ?? 0,
    }));
    return {
      id: `${nonce}-${i}`,
      label: labels[i] ?? 'Route ' + (i + 1),
      etaMin: Math.max(1, Math.round((leg?.duration?.value ?? 0) / 60)),
      distanceKm: Math.round(((leg?.distance?.value ?? 0) / 1000) * 10) / 10,
      note: i === 0 ? 'recommended' : undefined,
      steps,
      polyline: r.overview_polyline?.points,
      origin,
      destination,
    };
  });
}

/**
 * Google Maps routing service.
 * Priority: backend proxy (API.baseUrl) → direct Directions API (dev fallback) → demo.
 */
export async function fetchRoutes(origin: string, destination: string): Promise<RouteOption[]> {
  if (hasApi()) {
    const url =
      apiUrl('/api/v1/navigation/directions') +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      '&mode=walking';
    const res = await fetch(url);
    if (!res.ok) throw new Error('API HTTP ' + res.status);
    const json = (await res.json()) as { routes: RouteOption[] };
    return json.routes;
  }
  if (!MAPS.apiKey) {
    await new Promise((r) => setTimeout(r, 600));
    return [
      {
        id: 'demo1',
        label: 'Fastest (demo)',
        etaMin: 12,
        distanceKm: 1.4,
        note: 'add a backend or Maps API key',
        steps: [
          { instruction: 'Run backend/ and set API.baseUrl in src/config.ts', distanceM: 0, endLat: 0, endLng: 0 },
          { instruction: 'Or add a Maps key to src/config.ts (MAPS.apiKey)', distanceM: 0, endLat: 0, endLng: 0 },
          { instruction: 'Reload and route for real', distanceM: 0, endLat: 0, endLng: 0 },
        ],
        origin,
        destination,
      },
    ];
  }
  return directions(origin, destination, Date.now());
}
