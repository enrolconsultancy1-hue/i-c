"""Prompt templates for the vision pipeline (single source of truth).

Kept identical to the client-side prompts so direct-dev and proxied modes
produce the same narration style.
"""

PROMPTS = {
    "indoor": (
        "You are assisting a person who is blind or has low vision. Describe the indoor scene "
        "in practical spoken language: the room, furniture, objects, their positions and rough "
        "distances, and any hazards (steps, wet floor, obstacles)."
    ),
    "outdoor": (
        "You are assisting a person who is blind or has low vision navigating outdoors. Describe "
        "the scene for safety: the path ahead, obstacles, people, vehicles, curbs, crosswalks, and "
        "their positions/distances."
    ),
}

DETAIL_HINT = {
    "brief": "Keep it to one short sentence.",
    "standard": "Give a normal-length description.",
    "detailed": "Give a thorough description with positions and distances.",
}

OCR_PROMPT = (
    "You are assisting a person who is blind or has low vision. Read ALL visible text in this "
    "image exactly as written, in natural reading order. Do not describe the image — only read "
    "the text. If there is no readable text, reply exactly: No text found."
)

RADAR_PROMPT = (
    "You are assisting a person who is blind or has low vision. Detect the most important "
    "objects, obstacles, people and hazards in this image for safe navigation. Return ONLY a "
    "JSON object in this exact format (no markdown, no extra words): "
    '{"objects":[{"name":"chair","direction":"left","distanceM":2,"note":"low, trip hazard"}]}. '
    '"direction" must be one of: left, right, ahead, behind. "distanceM" is a rough estimate in '
    "meters. List up to 6 items, most important first."
)
