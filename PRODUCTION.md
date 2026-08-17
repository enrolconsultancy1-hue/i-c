# eye see — Production Readiness Checklist

Status: functionally complete — real camera vision (Gemini), OCR text reading, obstacle radar,
live GPS navigation, continuous narration (WebSocket), and voice commands. A FastAPI backend
(`backend/`) proxies Gemini (vision + speech) and Maps so keys stay server-side.

## 1. Secrets (do before shipping)
- ✅ Gemini + Maps keys moved out of `app/src/config.ts` into `backend/.env` (see `backend/.env.example`).
- Set `GEMINI_API_KEY` and `GOOGLE_MAPS_API_KEY` in `backend/.env`, then point the app at it via
  `API.baseUrl` in `app/src/config.ts`.
- Restrict the Maps key in Google Cloud: HTTP referrer / Android package + iOS bundle restrictions,
  and enable only the Directions API (and Maps SDK for standalone builds).
- Never commit `.env` — already covered by the root `.gitignore`.

## 2. Google Cloud setup
- Create a Maps API key with **Directions API** enabled → paste into `backend/.env` → `GOOGLE_MAPS_API_KEY`.
- For standalone builds, also enable **Maps SDK for Android** and **Maps SDK for iOS** and set the key in `app.json`.

## 3. Build & distribution
- `npm install -g eas-cli`, then `eas login`, then `eas build --platform all` (or per store).
- Replace the default app icon + splash in `app/assets`.
- Review Play Store / App Store accessibility declarations (this is an accessibility product).

## 4. Voice input
- ✅ Voice commands implemented (`expo-audio` recording + `/api/v1/speech/transcribe` via Gemini).
- Verify the audio container works with Gemini: the app records `.m4a` (AAC) and sends
  `audio/mp4`; if transcription fails, switch the recording preset to a Gemini-friendly format
  (e.g. WAV) in `app/src/components/VoiceButton.tsx` + `app/src/services/voice.ts`.

## 5. Offline fallback
- Planned, not yet coded — see [`docs/OFFLINE_MODE.md`](docs/OFFLINE_MODE.md) for the step-by-step
  guide (Level 1 caching → on-device OCR/object detection → offline navigation).
- The `offline` flag is already wired through the UI (`StatusStrip`); Level 1 caching is the
  first code step and works in Expo Go.

## 6. Backend deployment
- Deploy `backend/` (Cloud Run / a small VM) and set `API.baseUrl` to its HTTPS URL.
- Lock `CORS_ORIGINS` to your production origins instead of `*`.
