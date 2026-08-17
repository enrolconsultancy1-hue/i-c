# eye see — Real-Time AI Guide for Vision Disability

A camera-first mobile assistant that narrates the world for people who are blind or have low vision.
Point the phone camera and **eye see** describes scenes, reads signs and text, identifies objects and
obstacles, and gives spatial-audio navigation cues in natural language.

> Working-name history: **i-C** → **ClearSight** → **eye see** (current).

---

## What's in this repo

```
i-C/
├── app/            Expo (React Native + TypeScript) mobile app — the product UI
├── backend/        FastAPI (Python) service — proxies Gemini Vision + Google Maps
├── design/         UI design deliverables (interactive prototype + infinite canvas)
├── docs/           ARCHITECTURE.md · API.md · WEARABLE_ROADMAP.md · OFFLINE_MODE.md
├── README.md       this file
└── PRODUCTION.md   production-readiness checklist
```

- **Interactive prototype** — the live-camera home screen, touchable: describe / detail level / theme / offline / radar / text reader / Google Maps guidance.
- **Infinite canvas** — one pan/zoom board with project context, design system, and all 12 screens.
- **`app/`** — the real Expo source; the `design/` files are its visual specification.
- **`backend/`** — holds the AI + Maps keys server-side so the client ships clean.

---

## Functional modules

1. **Live scene description** — real-time camera + vision AI narration.
2. **Text & sign reading** — OCR, read aloud.
3. **Obstacle & object detection** — proximity + direction cues.
4. **Navigation** — Google Maps real-time guided routing (see below).
5. **Detail control** — Brief / Standard / Detailed verbosity + speech rate.
6. **Offline mode** — on-device models, cached descriptions (see [`docs/OFFLINE_MODE.md`](docs/OFFLINE_MODE.md)).
7. **Language & speech** — multilingual + text-to-speech.
8. **Settings & accessibility** — high-contrast UI, text scaling, privacy.

---

## Quick start

### 1. Backend (holds the API keys)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate     macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env                # add GEMINI_API_KEY and GOOGLE_MAPS_API_KEY
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Mobile app

```bash
cd app
npm install
npx expo start
```

Then set `API.baseUrl` in `app/src/config.ts` to your machine's LAN IP (e.g.
`http://192.168.1.20:8000`). Leave it empty to run in demo/mock mode without keys.

---

## Navigation — Google Maps real-time guided routing

- **Directions API** — computes the route (fastest / accessible / avoid-stairs variants), now
  proxied through `backend/` so the key stays server-side.
- **Navigation SDK** — live turn-by-turn voice + traffic-aware rerouting (standalone builds).
- **eye see layer** — keeps narrating obstacles and hazards along the route with spatial-audio cues.

---

## Tech stack

- **Frontend**: Expo (React Native + TypeScript), `expo-camera`, `expo-speech`, `expo-location`, `expo-audio`.
- **Backend**: FastAPI (Python) + httpx — Gemini Vision/Audio + Google Directions proxy.
- **Vision**: Gemini Vision (cloud now), YOLO + on-device models (roadmap).
- **Navigation**: Google Maps Directions API + Navigation SDK.

---

## Future: wearable smart glasses

The long-term goal is a wearable glasses form factor. See
**[`docs/WEARABLE_ROADMAP.md`](docs/WEARABLE_ROADMAP.md)** for the phased plan
(phone MVP → tethered prototype → self-contained edge device → consumer product).

---

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — system design, data flow, security & privacy.
- [`docs/API.md`](docs/API.md) — backend API reference.
- [`docs/WEARABLE_ROADMAP.md`](docs/WEARABLE_ROADMAP.md) — smart-glasses future plan.
- [`docs/OFFLINE_MODE.md`](docs/OFFLINE_MODE.md) — step-by-step offline functionality guide.
- [`PRODUCTION.md`](PRODUCTION.md) — shipping checklist.

## How to view the design

Double-click either `.html` file under `design/`. No build step, no server, no dependencies.
