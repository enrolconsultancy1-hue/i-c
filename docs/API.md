# eye see — API reference

Base URL: `http://<host>:8000` · Interactive docs at `/docs`.

All vision endpoints accept `image_base64` — a JPEG or PNG frame, base64-encoded, **no** data-URI prefix.

## GET /health
→ `200` `{"status":"ok","service":"eye-see-backend"}`

## POST /api/v1/vision/describe

Request:

```json
{ "image_base64": "...", "mode": "outdoor", "detail": "standard" }
```

- `mode`: `indoor` | `outdoor`
- `detail`: `brief` | `standard` | `detailed`

Response:

```json
{ "text": "You're on a sidewalk. A bench is two meters to your left..." }
```

## POST /api/v1/vision/ocr

Request:

```json
{ "image_base64": "..." }
```

Response:

```json
{ "text": "EXIT" }
```

Reads all visible text in natural reading order; replies `No text found` when none.

## POST /api/v1/vision/radar

Request:

```json
{ "image_base64": "..." }
```

Response:

```json
{
  "objects": [
    { "name": "chair", "direction": "left", "distanceM": 2, "note": "low, trip hazard" }
  ]
}
```

`direction` ∈ `left | right | ahead | behind`. Up to 6 objects, most important first.

## WS /api/v1/vision/stream

Continuous scene narration over a WebSocket (`ws://<host>:8000/api/v1/vision/stream`).

Client → server (one JSON message per captured frame):

```json
{ "image_base64": "...", "mode": "outdoor", "detail": "standard" }
```

Server → client:

```json
{ "type": "narration", "text": "You're on a sidewalk..." }
```

```json
{ "type": "error", "message": "GEMINI_API_KEY is not configured on the server" }
```

Behavior: **latest-frame-wins** — if frames arrive faster than the model can answer, stale
frames are skipped. Identical consecutive narration is suppressed so clients don't spam TTS.

## GET /api/v1/navigation/directions

Query params: `origin` (`"lat,lng"` or address), `destination`, `mode` (default `walking`).

Response:

```json
{
  "routes": [
    {
      "id": "0",
      "label": "Fastest",
      "etaMin": 12,
      "distanceKm": 1.4,
      "note": "recommended",
      "origin": "37.77,-122.41",
      "destination": "Ferry Building",
      "polyline": "encoded-polyline-string",
      "steps": [
        { "instruction": "Head north...", "distanceM": 42, "endLat": 37.77, "endLng": -122.41 }
      ]
    }
  ]
}
```

## Errors

Business errors (missing keys, upstream failures) surface as HTTP 4xx/5xx with a `detail` string.
Standard FastAPI validation errors return 422 with the invalid field. On the WebSocket, errors
are delivered as `{"type":"error","message":"..."}` frames.
