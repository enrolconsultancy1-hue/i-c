# eye see — Architecture

## System overview

eye see is a **camera-first AI guide** for blind and low-vision users. The phone (and, in the
future, a wearable glasses device) captures the world; a perception pipeline turns frames into
spoken guidance.

```
┌───────────────────────────────┐        ┌────────────────────────────────┐
│  Mobile app  (app/)           │  HTTP  │  Backend  (backend/)            │
│  Expo / React Native / TS     │ + WS   │  FastAPI / Python               │
│  camera · TTS · GPS · UI      │───────▶│  /vision/* · /navigation/*      │
└───────────────────────────────┘        └──────────────┬─────────────────┘
                                                        │  server-side keys
                                            ┌───────────┴─────────────┐
                                            │  Gemini Vision           │
                                            │  Google Maps Directions  │
                                            └─────────────────────────┘
```

## Layers

1. **Capture** (`expo-camera`) — frames + GPS + orientation.
2. **Perception** (Gemini via backend) — scene description, OCR, object/obstacle detection.
3. **Reasoning / safety** — the prompts embed a safety frame: positions, distances, hazards.
4. **Presentation** — text-to-speech (`expo-speech`) + spatial-audio direction cues + high-contrast UI.
5. **Navigation** — Google Directions (via backend) + optional Navigation SDK for turn-by-turn.

## Data flow (single-shot describe)

1. User taps Describe → `LiveViewScreen` captures a frame.
2. `services/vision.ts` POSTs base64 frame + `{mode, detail}` to `/api/v1/vision/describe`.
3. Backend calls Gemini with the safety-focused prompt, returns plain narration text.
4. App speaks it via `services/speech.ts` and shows it in `NarrationCard`.

## Data flow (continuous narration)

1. User enables "Continuous narration" → `LiveViewScreen` opens a WebSocket to
   `/api/v1/vision/stream` and captures a frame every ~1.6 s.
2. Each frame is sent as JSON; the backend coalesces with **latest-frame-wins** (stale frames
   are skipped while Gemini is busy) and **suppresses duplicate narration**.
3. Narration arrives as `{"type":"narration","text":...}`; the app gates TTS (≥3.5 s between
   utterances, no repeats) and speaks via `speech.ts`.
4. This transport is the same one the wearable glasses will use in Phase 1.

## Key decisions

- **Keys live server-side.** The client never embeds `GEMINI_API_KEY` or `GOOGLE_MAPS_API_KEY`
  in production. `API.baseUrl` (empty = demo/mock mode) points the app at the backend.
- **REST for single-shot, WebSocket for continuous.** On-demand actions (Describe / OCR / Radar /
  Directions) use simple HTTP. Continuous real-time narration streams frames over a WebSocket
  with coalescing + dedup — the exact pattern needed for the wearable (Phase 1).
- **Python backend.** The perception pipeline (today Gemini, tomorrow on-device YOLO/depth)
  belongs in Python so it can move cloud → edge with minimal rewrites.

## Security & privacy

- Gemini + Maps keys live only in `backend/.env` (never committed — see `.gitignore`).
- A vision-disability product is inherently camera-on; treat frames as sensitive:
  - Send frames only while the user is actively describing or streaming (no background upload).
  - Strip EXIF/geotags from frames before upload (planned).
  - Prefer on-device inference long-term (see `WEARABLE_ROADMAP.md`).
  - The backend is stateless today: it does not store frames or narration. If you add
    history/analytics, encrypt at rest and make it opt-in.

## Directory map

See the tree in the root `README.md`.
