# eye see — app source (i-C)

A camera-first mobile assistant that narrates the world for blind and low-vision people.
This is the **Expo (React Native + TypeScript)** scaffold — the UI follows the design
deliverables in `../design/`.

## Prerequisites

- Node.js 18+
- Expo Go app on a phone, or an Android/iOS simulator
- (Recommended) the `../backend/` service for real vision + navigation without shipping keys

## Install & run

```bash
cd i-C/app
npm install
npx expo install expo-camera expo-speech
npx expo start
```

- `@expo/vector-icons` ships with Expo (no separate install).
- Scan the QR code with Expo Go, or press `a` / `i` for a simulator.

### Wire up the backend (recommended)

1. Start `../backend/` (see its README).
2. In `src/config.ts` set `API.baseUrl` to your machine's LAN IP, e.g. `http://192.168.1.20:8000`.
3. The app now proxies all vision + navigation calls through the backend — no keys in the bundle.

Leave `API.baseUrl` empty to run in demo/mock mode.

### External camera (Phase 1 glasses prep)

To use an external WiFi camera (e.g. an **ESP32-CAM**) instead of the phone camera:

1. Flash the stock ESP32-CAM example and note its **single-JPEG snapshot** URL
   (typically `http://<camera-ip>/capture`; the MJPEG stream is a separate `/stream` route).
2. In `src/config.ts` set `CAMERA.captureUrl` to that snapshot URL.
3. The app fetches one JPEG per capture from that URL — no native camera plugin needed.

When `CAMERA.captureUrl` is set, the phone camera is not used and no camera permission
is requested. Pair a Bluetooth bone-conduction headset to the phone for audio.

### Google Maps (standalone builds)

```bash
npx expo install react-native-maps
```

Then add your Google Maps API key and swap the placeholder map `<View>` in
`src/screens/RoutePreviewScreen.tsx` and `src/screens/NavigationScreen.tsx`
for `react-native-maps` `<MapView>` + `<Polyline>`.

## Structure

```
app/
├── App.tsx                      # root: theme + screen router
└── src/
    ├── theme.ts                 # design tokens (colors, font)
    ├── types.ts                 # shared types
    ├── config.ts                # API.baseUrl, CAMERA.captureUrl, dev-only keys
    ├── context/AppContext.tsx   # global state (theme, detail, offline, narration)
    ├── services/
    │   ├── api.ts               # tiny HTTP client for the backend
    │   ├── frame.ts             # fetch external-camera frames (Phase 1)
    │   ├── vision.ts            # scene description / OCR / radar (backend → dev → mock)
    │   ├── stream.ts            # WebSocket live narration (auto-reconnect)
    │   ├── voice.ts             # speech-to-text + command parsing
    │   ├── speech.ts            # text-to-speech (expo-speech)
    │   └── maps.ts              # routing (backend → Directions API → demo)
    ├── components/              # StatusStrip, NarrationCard, DescribeButton, etc.
    └── screens/                 # LiveView, Radar, TextReader, RoutePreview, Navigation
```

## Where to implement the real features

- **Vision** — `src/services/vision.ts`: already wired to the backend proxy; swap the backend's
  Gemini call for YOLO (on-device) later.
- **Frame source** — `src/services/frame.ts` + `CAMERA.captureUrl` in `src/config.ts`: the
  external-camera path for Phase 1 glasses.
- **Speech** — `src/services/speech.ts`: pick voice per language via
  `Speech.getAvailableVoicesAsync()`.
- **Google Maps** — `src/services/maps.ts`: routed through the backend; add the Navigation SDK
  for turn-by-turn + traffic-aware rerouting.
- **Offline** — the `offline` flag in `AppContext` is wired to the UI; add on-device model
  download + caching behind it.

## Indoor / Outdoor mode

A global `mode` in `AppContext` switches behavior:

- **Indoor** — describes household layout, furniture and items; the Navigate action is disabled.
- **Outdoor** (default) — describes outdoor scenes and enables Google Maps routing.

The toggle lives in `src/components/ModeToggle.tsx`; the mode-aware vocabulary lives in
`src/services/vision.ts` (`NARRATION`).

## Current scope

The app runs with mock vision/routing data when no backend/key is configured. Camera uses
`expo-camera` (or an external camera URL) with a permission request; TTS uses `expo-speech`;
voice commands use `expo-audio` + the backend's speech endpoint.
