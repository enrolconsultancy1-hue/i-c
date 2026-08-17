from fastapi.testclient import TestClient

from app.main import app
from app.services import gemini

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "service": "eye-see-backend"}


def test_describe_ok(monkeypatch):
    async def fake_describe(image_b64, mode, detail):
        return "A test description."

    monkeypatch.setattr(gemini, "describe", fake_describe)
    r = client.post(
        "/api/v1/vision/describe",
        json={"image_base64": "aaa", "mode": "outdoor", "detail": "brief"},
    )
    assert r.status_code == 200
    assert r.json()["text"] == "A test description."


def test_ocr_ok(monkeypatch):
    async def fake_ocr(image_b64):
        return "EXIT"

    monkeypatch.setattr(gemini, "ocr", fake_ocr)
    r = client.post("/api/v1/vision/ocr", json={"image_base64": "aaa"})
    assert r.status_code == 200
    assert r.json()["text"] == "EXIT"


def test_radar_ok(monkeypatch):
    async def fake_radar(image_b64):
        return [{"name": "chair", "direction": "left", "distanceM": 2.0, "note": None}]

    monkeypatch.setattr(gemini, "radar", fake_radar)
    r = client.post("/api/v1/vision/radar", json={"image_base64": "aaa"})
    assert r.status_code == 200
    assert r.json()["objects"][0]["name"] == "chair"


def test_transcribe_ok(monkeypatch):
    async def fake_transcribe(audio_b64, mime_type):
        return "describe"

    monkeypatch.setattr(gemini, "transcribe", fake_transcribe)
    r = client.post(
        "/api/v1/speech/transcribe",
        json={"audio_base64": "aaa", "mime_type": "audio/mp4"},
    )
    assert r.status_code == 200
    assert r.json()["text"] == "describe"


def test_invalid_detail_rejected():
    r = client.post("/api/v1/vision/describe", json={"image_base64": "aaa", "detail": "verbose"})
    assert r.status_code == 422
