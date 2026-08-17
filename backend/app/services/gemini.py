"""Async client for the Google Gemini (generativelanguage) API."""
import json

import httpx

from .. import config
from . import prompts

_API = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


async def _generate(parts: list[dict]) -> str:
    if not config.GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured on the server")
    url = _API.format(model=config.GEMINI_MODEL) + f"?key={config.GEMINI_API_KEY}"
    payload = {"contents": [{"parts": parts}]}
    async with httpx.AsyncClient(timeout=40.0) as client:
        resp = await client.post(url, json=payload)
    resp.raise_for_status()
    data = resp.json()
    parts_out = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    text = " ".join(p.get("text", "") for p in parts_out if isinstance(p, dict)).strip()
    if not text:
        raise RuntimeError("Gemini returned no text")
    return text


def image_part(image_b64: str) -> dict:
    mime = "image/png" if image_b64.startswith("iVBOR") else "image/jpeg"
    return {"inline_data": {"mime_type": mime, "data": image_b64}}


async def describe(image_b64: str, mode: str, detail: str) -> str:
    text_prompt = f"{prompts.PROMPTS[mode]} {prompts.DETAIL_HINT[detail]}"
    return await _generate([{"text": text_prompt}, image_part(image_b64)])


async def ocr(image_b64: str) -> str:
    return await _generate([{"text": prompts.OCR_PROMPT}, image_part(image_b64)])


async def radar(image_b64: str) -> list[dict]:
    raw = await _generate([{"text": prompts.RADAR_PROMPT}, image_part(image_b64)])
    return _parse_radar(raw)


_DIRECTIONS = {"left", "right", "ahead", "behind"}


def _parse_radar(raw: str) -> list[dict]:
    clean = raw.replace("```json", "").replace("```", "").strip()
    start, end = clean.find("{"), clean.rfind("}")
    if start == -1 or end == -1:
        return []
    data = json.loads(clean[start : end + 1])
    objs = data.get("objects") if isinstance(data, dict) else []
    if not isinstance(objs, list):
        return []
    out: list[dict] = []
    for o in objs[:6]:
        if not isinstance(o, dict):
            continue
        direction = str(o.get("direction", "ahead")).lower()
        if direction not in _DIRECTIONS:
            direction = "ahead"
        try:
            dist = float(o.get("distanceM", 1))
        except (TypeError, ValueError):
            dist = 1.0
        note = o.get("note")
        out.append(
            {
                "name": str(o.get("name", "Object")),
                "direction": direction,
                "distanceM": max(dist, 0.1),
                "note": str(note) if note else None,
            }
        )
    return out
