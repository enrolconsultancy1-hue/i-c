import json

from app.services.gemini import _parse_radar


def test_parses_clean_json():
    raw = '{"objects":[{"name":"chair","direction":"left","distanceM":2,"note":"low"}]}'
    objs = _parse_radar(raw)
    assert len(objs) == 1
    assert objs[0]["name"] == "chair"
    assert objs[0]["direction"] == "left"
    assert objs[0]["distanceM"] == 2.0
    assert objs[0]["note"] == "low"


def test_strips_markdown_fences():
    raw = '```json\n{"objects":[{"name":"door","direction":"right","distanceM":1.5}]}\n```'
    objs = _parse_radar(raw)
    assert objs[0]["name"] == "door"


def test_normalizes_unknown_direction():
    raw = '{"objects":[{"name":"x","direction":"north","distanceM":1}]}'
    assert _parse_radar(raw)[0]["direction"] == "ahead"


def test_clamps_nonpositive_distance():
    raw = '{"objects":[{"name":"x","direction":"ahead","distanceM":-3}]}'
    assert _parse_radar(raw)[0]["distanceM"] == 0.1


def test_caps_at_six_objects():
    raw = json.dumps(
        {"objects": [{"name": f"o{i}", "direction": "ahead", "distanceM": 1} for i in range(10)]}
    )
    assert len(_parse_radar(raw)) == 6


def test_handles_garbage():
    assert _parse_radar("no json here") == []
    assert _parse_radar('{"nope": true}') == []
    assert _parse_radar("") == []
