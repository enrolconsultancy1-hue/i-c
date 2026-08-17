// ============================================================================
// eye see — runtime configuration
// ============================================================================
// API keys must NEVER be committed here. For production, run the `backend/`
// service (see ../backend/README.md) and point API.baseUrl at it. The app then
// proxies all Gemini + Google Maps calls through the server, which holds the
// keys in its own `.env` file.
// ============================================================================

export const API = {
  // Example: 'http://192.168.1.20:8000' (your dev machine's LAN IP for Expo Go,
  // or 'http://localhost:8000' for the web build). Empty = demo/mock mode.
  baseUrl: '',
};

export const CAMERA = {
  // Optional external camera (Phase 1 glasses prep). Point this at a single-JPEG
  // snapshot endpoint, e.g. an ESP32-CAM: 'http://192.168.4.1/capture'. When set,
  // the app captures frames from this URL instead of the on-device camera.
  captureUrl: '',
};

export const VISION = {
  provider: 'gemini' as const,
  // Dev-only fallback used only when API.baseUrl is empty. Prefer the backend.
  apiKey: '',
  model: 'gemini-2.5-flash',
};

export const MAPS = {
  // Dev-only fallback used only when API.baseUrl is empty. Prefer the backend.
  apiKey: '',
};
