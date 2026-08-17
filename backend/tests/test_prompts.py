from app.services import prompts


def test_scene_prompts_include_safety_context():
    for mode in ("indoor", "outdoor"):
        p = prompts.PROMPTS[mode].lower()
        assert "blind" in p or "low vision" in p


def test_detail_hints_cover_all_levels():
    assert set(prompts.DETAIL_HINT) == {"brief", "standard", "detailed"}


def test_radar_prompt_requires_json_object():
    assert '"objects"' in prompts.RADAR_PROMPT
    assert "JSON" in prompts.RADAR_PROMPT


def test_ocr_prompt_reads_all_text():
    assert "Read ALL visible text" in prompts.OCR_PROMPT


def test_transcribe_prompt_present():
    assert "Transcribe" in prompts.TRANSCRIBE_PROMPT
