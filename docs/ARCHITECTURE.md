# eye see — Architecture

## System overview

eye see is a **camera-first AI guide** for blind and low-vision users. The phone (and, in the
future, a wearable glasses device) captures the world; a perception pipeline turns frames into
spoken guidance.

```
┌───────────────────────────────┐        ┌────────────────────────────────┐
│  Mobile app  (app/)           │  HTTP  │  Backend  (backend/)            │
│  Expo / React Native / TS     │ + WS   │  FastAPI / Python               │
│  camera · mic · TTS · GPS · UI│───────▶│  /vision/* /speech/* /nav/*     │
└───────────────────────────────┘        └──────────────┬─────────────────┘
                                                        │  server-side keys
                                            ┌───────────┴─────────────┐
                                            │  Gemini Vision + Audio   │
                                            │  Google Maps Directions  │
                                            └─────────────────────────┘
```

## Layers

1. **Capture** (`expo-camera` **or** an external camera URL) + `expo-audio` — frames + audio +
   GPS + orientation.
2. **Perception** (Gemini via backend) — scene description, OCR, object/obstacle detection,
   and speech transcription (voice commands).
3. **Reasoning / safety** — the prompts embed a safety frame: positions, distances, hazards.
4. **Presentation** — text-to-speech (`expo-speech`) + spatial-audio direction cues + high-contrast UI.
5. **Navigation** — Google Directions (via backend) + optional Navigation SDK for turn-by-turn.

## Frame source

The app has two interchangeable frame sources:

- **On-device** (default): `expo-camera` captures a frame with `takePictureAsync({ base64: true })`.
- **External** (Phase 1 glasses): set `CAMERA.captureUrl` in `config.ts` to a single-JPEG
  snapshot endpoint (e.g. an ESP32-CAM `/capture` route). `services/frame.ts` fetches one JPEG
  per capture and base64-encodes it — no native camera plugin needed.

Everything downstream (describe / OCR / radar / streaming) consumes a base64 frame and is
agnostic to the source.

## Data flow (single-shot describe)

1. User taps Describe → `LiveViewScreen` captures a frame (on-device or external).
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
4. The client auto-reconnects with exponential backoff (capped at 15 s) if the socket drops,
   so a transient network blip doesn't end the session.
5. This transport is the same one the wearable glasses will use in Phase 1.

## Data flow (voice command)

1. User taps "Voice command" → `VoiceButton` requests mic permission and records via `expo-audio`.
2. On stop, the recording is read as base64 (`expo-file-system`) and POSTed to
   `/api/v1/speech/transcribe` with its MIME type.
3. The backend transcribes via Gemini audio; the app maps the transcript to a command
   (`services/voice.ts` → describe / read / radar / navigate / stop / home) and executes it.
4. This gives hands-free control — the primary interaction model for wearable glasses.

## Key decisions

- **Keys live server-side.** The client never embeds `GEMINI_API_KEY` or `GOOGLE_MAPS_API_KEY`
  in production. `API.baseUrl` (empty = demo/mock mode) points the app at the backend.
- **REST for single-shot, WebSocket for continuous.** On-demand actions (Describe / OCR / Radar /
  Transcribe / Directions) use simple HTTP. Continuous real-time narration streams frames over a
  WebSocket with coalescing + dedup + auto-reconnect — the exact pattern needed for the wearable.
- **Frame source is swappable.** The app supports both the phone camera and an external camera
  URL, so Phase 1 hardware (a stock WiFi camera on glasses) needs only a config string.
- **Python backend.** The perception pipeline (today Gemini, tomorrow on-device YOLO/depth)
  belongs in Python so it can move cloud → edge with minimal rewrites.

## Testing

- Backend: `pytest` (`backend/tests/`) — radar JSON parser, prompt templates, REST routers
  (Gemini mocked). Run with `pip install -r requirements-dev.txt && pytest`.
- Frontend: `tsc --noEmit` typecheck.

## Security & privacy

- Gemini + Maps keys live only in `backend/.env` (never committed — see `.gitignore`).
- A vision-disability product is inherently camera-on and now mic-capable; treat frames and audio
  as sensitive:
  - Send frames/audio only while the user is actively describing, streaming, or speaking.
  - Strip EXIF/geotags from frames before upload (planned).
  - Prefer on-device inference long-term (see `WEARABLE_ROADMAP.md`).
  - The backend is stateless today: it does not store frames, audio, or narration. If you add
    history/analytics, encrypt at rest and make it opt-in.

## Directory map

See the tree in the root `README.md`.
