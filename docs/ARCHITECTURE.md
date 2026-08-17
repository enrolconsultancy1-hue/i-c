# eye see — Architecture

## System overview

eye see is a **camera-first AI guide** for blind and low-vision users. The phone (and, in the
future, a wearable glasses device) captures the world; a perception pipeline turns frames into
spoken guidance.

```
┌───────────────────────────────┐        ┌────────────────────────────────┐
│  Mobile app  (app/)           │  HTTP  │  Backend  (backend/)            │
│  Expo / React Native / TS     │───────▶│  FastAPI / Python               │
│  camera · TTS · GPS · UI      │  JSON  │  /vision/* · /navigation/*      │
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

## Data flow (describe scene)

1. User taps Describe (or auto-capture triggers) → `LiveViewScreen` captures a frame.
2. `services/vision.ts` POSTs base64 frame + `{mode, detail}` to `/api/v1/vision/describe`.
3. Backend calls Gemini with the safety-focused prompt, returns plain narration text.
4. App speaks it via `services/speech.ts` and shows it in `NarrationCard`.

## Key decisions

- **Keys live server-side.** The client never embeds `GEMINI_API_KEY` or `GOOGLE_MAPS_API_KEY`
  in production. `API.baseUrl` (empty = demo/mock mode) points the app at the backend.
- **Request/response over WebSocket for v1.** Frames are captured on demand, so a simple
  HTTP model keeps latency predictable and the surface small. A streaming WebSocket channel is
  the planned upgrade for continuous real-time narration (see the wearable roadmap).
- **Python backend.** The perception pipeline (today Gemini, tomorrow on-device YOLO/depth)
  belongs in Python so it can move cloud → edge with minimal rewrites.

## Security & privacy

- Gemini + Maps keys live only in `backend/.env` (never committed — see `.gitignore`).
- A vision-disability product is inherently camera-on; treat frames as sensitive:
  - Send frames only while the user is actively describing (no background upload).
  - Strip EXIF/geotags from frames before upload (planned).
  - Prefer on-device inference long-term (see `WEARABLE_ROADMAP.md`).
  - The backend is stateless today: it does not store frames or narration. If you add
    history/analytics, encrypt at rest and make it opt-in.

## Directory map

See the tree in the root `README.md`.
