# Offline Mode — Implementation Guide

How to make **eye see** work without a network connection. This is a phased plan —
each level is independent and can be shipped incrementally.

## Why offline matters

- Blind/low-vision users can't rely on connectivity: tunnels, basements, dead zones,
  data caps, and emergencies.
- The wearable glasses (Phase 2) must function without a phone's cellular link.
- A degraded but working fallback is always better than silence.

## Current state (what already exists)

| Piece | Status |
|-------|--------|
| `offline` flag | ✅ Wired end-to-end — `AppContext.offline`, toggled in `StatusStrip` ("ON/OFF" dot). |
| `describeScene(detail, offline, mode, image)` | ⚠️ Offline only shortens the mock delay (500ms vs 900ms), then returns static `NARRATION[mode][detail]` text. Not real. |
| `readTextFromImage` / `detectObstacles` | ⚠️ Throw unless a backend/key is configured — the `offline` flag does nothing for them. |
| Caching / on-device models | ❌ None. |

So today "offline mode" is a UX placeholder. Below is how to make it real, in layers.

---

## The strategy at a glance

| Level | What it gives you | Requires dev build? | Effort |
|-------|-------------------|---------------------|--------|
| **1** | Cached "last known" narration + static safety fallback | ❌ No (Expo Go OK) | Low |
| **2** | On-device OCR + object detection | ✅ Yes | Medium |
| **3** | On-device scene captioning | ✅ Yes | High |
| **4** | Offline navigation (cached routes) | ❌ No | Medium |

> **The single most important gotcha:** ML Kit / Vision Camera / on-device models are
> **native modules that are NOT included in Expo Go**. Levels 2–3 require switching to a
> development build (`npx expo prebuild` or `eas build --profile development`). Level 1 and
> Level 4 work in Expo Go with no native changes.

---

## Level 1 — Cached "last known" narrations (start here)

**Goal:** when offline, speak the last real narration (per mode) instead of generic mock text,
plus a safety fallback when nothing is cached.

**Why first:** pure JavaScript, works in Expo Go, immediate value, zero native risk.

### Steps

1. **Add AsyncStorage** (it is bundled in Expo Go — no dev build needed):
   ```bash
   cd app
   npx expo install @react-native-async-storage/async-storage
   ```

2. **Create `app/src/services/cache.ts`:**
   ```ts
   import AsyncStorage from '@react-native-async-storage/async-storage';
   import { DetectedObject } from '../types';

   const narrationKey = (mode: string) => `narration:${mode}`;
   const RADAR_KEY = 'radar:last';

   export async function saveNarration(mode: string, text: string) {
     try { await AsyncStorage.setItem(narrationKey(mode), text); } catch {}
   }
   export async function loadNarration(mode: string): Promise<string | null> {
     try { return await AsyncStorage.getItem(narrationKey(mode)); } catch { return null; }
   }
   export async function saveRadar(objs: DetectedObject[]) {
     try { await AsyncStorage.setItem(RADAR_KEY, JSON.stringify(objs)); } catch {}
   }
   export async function loadRadar(): Promise<DetectedObject[] | null> {
     try {
       const raw = await AsyncStorage.getItem(RADAR_KEY);
       return raw ? (JSON.parse(raw) as DetectedObject[]) : null;
     } catch { return null; }
   }
   ```

3. **Modify `app/src/services/vision.ts`:**
   - After a **successful** `describeScene` backend/direct call, `await saveNarration(mode, text)`.
   - After a **successful** `detectObstacles`, `await saveRadar(objects)`.
   - Change the offline fallback in `describeScene` from static mock to cached:
     ```ts
     if (offline) {
       const cached = await loadNarration(mode);
       if (cached) return '(offline) ' + cached;
       return OFFLINE_SAFETY;
     }
     ```
   - Change `readTextFromImage` / `detectObstacles` to return cached/fallback instead of throwing
     when offline.

4. **Add a static safety fallback** (in `vision.ts` or `config.ts`):
   ```ts
   export const OFFLINE_SAFETY =
     'Offline. No recent guidance is available. Proceed slowly and use your cane or a sighted guide.';
   ```

5. **Verify:** toggle offline in the UI, tap Describe → you hear the cached (or safety) text.
   Typecheck with `npx tsc --noEmit`.

**Files touched:** `services/cache.ts` (new), `services/vision.ts`, optionally `config.ts`.

---

## Level 2 — On-device OCR + object detection (requires a dev build)

**Goal:** offline text reading and obstacle radar without any network.

### Steps

1. **Generate native projects:**
   ```bash
   cd app
   npx expo prebuild
   ```
2. **Add a native vision stack** — two common routes:
   - **Route A (recommended):** `react-native-vision-camera` + `react-native-worklets-core`
     (frame processors) + ML Kit, or
   - **Route B:** the `@react-native-ml-kit/text-recognition` and
     `@react-native-ml-kit/object-detection` packages directly.
3. **Add a frame processor** that runs OCR + object detection per frame and emits
   `{ text, objects: [{ label, boundingBox }] }`.
4. **Wire the offline branch in `vision.ts`:**
   - `readTextFromImage` → local OCR result.
   - `detectObstacles` → map detected labels to `{ name, direction, distanceM, note }`.
     Direction comes from the bounding-box x-position; `distanceM` is approximate
     (monocular — no true depth), so clamp to a coarse band and say so in the note.
5. **Keep cloud as the "detailed" path**; use on-device for "brief" and for the safety layer.

**Tradeoffs:** coarse labels only, no true distance, ~several MB model, and **you must build
with EAS or a dev client instead of Expo Go** from this point on.

**Files touched:** `vision.ts`, a new `services/localDetect.ts`, `app.json` (permissions/plugins).

---

## Level 3 — On-device scene captioning (advanced)

**Goal:** a full sentence description offline, not just labels.

### Steps

1. Export a small, quantized vision-language or captioning model to **ONNX/TFLite**.
2. Bundle it under `app/assets/models/`.
3. Load it with `onnxruntime-react-native` (or `@tensorflow/tfjs-react-native`) in a new
   `services/localCaption.ts`.
4. In `describeScene`, the offline branch calls `localCaption(imageBase64)` for
   `brief`/`standard` detail levels.

**Tradeoffs:** accuracy is meaningfully below Gemini; latency depends on the phone's NPU;
model size 50–200 MB if you're not careful. Only pursue this after Level 2 proves the pipeline.

---

## Level 4 — Offline navigation (cached routes)

**Goal:** turn-by-turn guidance continues when the map API is unreachable.

### Steps

1. When a route is fetched (`services/maps.ts`), cache it: the decoded polyline
   (`decodePolyline` already exists) + `steps` + origin/destination, written to
   `expo-file-system` as JSON.
2. In `fetchRoutes`, on network failure, return the cached route (marked "offline").
3. During navigation, follow the cached polyline + spoken steps; disable live rerouting.
4. Optional: pre-download map tiles for the route corridor.

**Files touched:** `services/maps.ts`, a new `services/routeCache.ts`, `NavigationScreen.tsx`.

---

## Recommended path & acceptance criteria

1. **Ship Level 1 now** — it's Expo Go-compatible and gives real offline value in an afternoon.
2. **Move to a dev build** when you're ready for Level 2 (you'll need dev builds anyway for
   Phase 2 glasses).
3. Add **Level 4** when navigation is being user-tested (connectivity drops are common there).
4. Treat **Level 3** as the last mile — only after Levels 1–2 are validated.

Acceptance for "offline works": with airplane mode on, the app (a) still speaks last-known or
safety guidance, (b) still reads text and detects obstacles (Level 2+), and (c) never throws a
raw error to a blind user — every failure degrades gracefully to speech.
