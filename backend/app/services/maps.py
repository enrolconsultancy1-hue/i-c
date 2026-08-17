"""Async proxy for the Google Maps Directions API (key stays server-side)."""
import html
import re

import httpx

from .. import config

_URL = "https://maps.googleapis.com/maps/api/directions/json"


def _strip_html(s: str) -> str:
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


async def directions(origin: str, destination: str, mode: str = "walking") -> list[dict]:
    if not config.GOOGLE_MAPS_API_KEY:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured on the server")
    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "alternatives": "true",
        "key": config.GOOGLE_MAPS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(_URL, params=params)
    resp.raise_for_status()
    data = resp.json()
    if data.get("status") != "OK":
        msg = "Directions API: " + data.get("status", "ERROR")
        if data.get("error_message"):
            msg += " — " + data["error_message"]
        raise RuntimeError(msg)

    labels = ["Fastest", "Alternative", "Alternative 2"]
    routes: list[dict] = []
    for i, route in enumerate(data.get("routes", [])[:3]):
        leg = (route.get("legs") or [{}])[0]
        steps = []
        for s in leg.get("steps", []):
            end = s.get("end_location", {})
            steps.append(
                {
                    "instruction": _strip_html(s.get("html_instructions", "Continue")),
                    "distanceM": s.get("distance", {}).get("value", 0),
                    "endLat": end.get("lat", 0),
                    "endLng": end.get("lng", 0),
                }
            )
        routes.append(
            {
                "id": str(i),
                "label": labels[i] if i < len(labels) else f"Route {i + 1}",
                "etaMin": max(1, round(leg.get("duration", {}).get("value", 0) / 60)),
                "distanceKm": round(leg.get("distance", {}).get("value", 0) / 1000, 1),
                "note": "recommended" if i == 0 else None,
                "steps": steps,
                "polyline": route.get("overview_polyline", {}).get("points"),
                "origin": origin,
                "destination": destination,
            }
        )
    return routes
