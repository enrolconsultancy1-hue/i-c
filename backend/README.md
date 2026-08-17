# eye see — backend

FastAPI service that sits between the mobile app and the external AI / navigation APIs.
It is the only place that holds secrets (Gemini + Google Maps keys), so the client bundle
can be distributed without exposing credentials.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | service info |
| GET | `/health` | liveness check |
| POST | `/api/v1/vision/describe` | scene narration |
| POST | `/api/v1/vision/ocr` | read text in a frame |
| POST | `/api/v1/vision/radar` | obstacle / object detection |
| WS | `/api/v1/vision/stream` | continuous scene narration (WebSocket) |
| GET | `/api/v1/navigation/directions` | walking routes (Directions proxy) |
| GET | `/docs` | interactive OpenAPI UI |

Full request/response shapes: see [`../docs/API.md`](../docs/API.md).

## Run

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate      macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env                  # then edit .env and add your keys
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000/docs to try the API.

## Configuration (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | yes (vision) | Google AI Studio API key |
| `GEMINI_MODEL` | no | default `gemini-2.5-flash` |
| `GOOGLE_MAPS_API_KEY` | yes (navigation) | Maps key with **Directions API** enabled |
| `CORS_ORIGINS` | no | comma-separated allowed origins, default `*` |

## Point the app at it

In [`app/src/config.ts`](../app/src/config.ts) set `API.baseUrl` to this server
(e.g. `http://192.168.1.20:8000` on your LAN for Expo Go). The app then routes all
vision + navigation calls through the backend.

The **continuous narration** mode streams camera frames to `/api/v1/vision/stream` over a
WebSocket; the client sends frames and the server replies with narration (latest-frame-wins,
duplicate-suppressed).

## Why Python?

The backend is the natural home for the computer-vision pipeline (Gemini now; later
YOLO / on-device model export, depth estimation and sensor fusion for the wearable
glasses). Keeping perception in Python lets the same code move from cloud proxy →
edge inference with minimal rewrites. See [`../docs/WEARABLE_ROADMAP.md`](../docs/WEARABLE_ROADMAP.md).
