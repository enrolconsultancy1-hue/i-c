# eye see — Production Readiness Checklist

Status: functionally complete — real camera vision (Gemini), OCR text reading, obstacle radar,
and live GPS navigation with auto-advance + rerouting. A FastAPI backend (`backend/`) now proxies
Gemini + Maps so keys stay server-side.

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

## 4. Voice input (optional)
- Wake-word / voice commands were removed to minimize permissions. Re-add the microphone permission +
  `expo-camera` `recordAudioAndroid: true` if voice input is added later.

## 5. Offline fallback (optional)
- ML Kit text/object detection for offline OCR/radar when there is no network.

## 6. Backend deployment
- Deploy `backend/` (Cloud Run / a small VM) and set `API.baseUrl` to its HTTPS URL.
- Lock `CORS_ORIGINS` to your production origins instead of `*`.
