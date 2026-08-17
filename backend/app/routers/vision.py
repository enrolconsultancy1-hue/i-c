import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..schemas import (
    DescribeRequest,
    OcrRequest,
    RadarRequest,
    RadarResponse,
    TextResponse,
)
from ..services import gemini

router = APIRouter()


@router.post("/describe", response_model=TextResponse)
async def describe(req: DescribeRequest):
    text = await gemini.describe(req.image_base64, req.mode, req.detail)
    return TextResponse(text=text)


@router.post("/ocr", response_model=TextResponse)
async def ocr(req: OcrRequest):
    text = await gemini.ocr(req.image_base64)
    return TextResponse(text=text)


@router.post("/radar", response_model=RadarResponse)
async def radar(req: RadarRequest):
    objects = await gemini.radar(req.image_base64)
    return RadarResponse(objects=objects)


@router.websocket("/stream")
async def stream(websocket: WebSocket):
    """Continuous scene narration over a WebSocket.

    Client sends JSON frames:
        {"image_base64": "...", "mode": "outdoor", "detail": "standard"}
    Server replies:
        {"type": "narration", "text": "..."}
        {"type": "error", "message": "..."}

    Uses a "latest frame wins" coalescing loop: if frames arrive faster than
    Gemini can answer, stale frames are skipped. Identical consecutive narration
    is suppressed so the client does not spam text-to-speech.
    """
    await websocket.accept()

    latest: dict | None = None
    last_text: str | None = None

    async def receiver() -> None:
        nonlocal latest
        try:
            while True:
                msg = await websocket.receive_json()
                if isinstance(msg, dict) and msg.get("image_base64"):
                    latest = msg
        except WebSocketDisconnect:
            return
        except Exception:
            return

    recv_task = asyncio.create_task(receiver())
    try:
        while not recv_task.done():
            if latest is None:
                await asyncio.sleep(0.05)
                continue
            msg = latest
            latest = None
            mode = msg.get("mode", "outdoor")
            detail = msg.get("detail", "standard")
            image_b64 = msg["image_base64"]
            try:
                text = await gemini.describe(image_b64, mode, detail)
            except Exception as exc:  # upstream / key / model errors
                await websocket.send_json({"type": "error", "message": str(exc)})
                continue
            if text and text != last_text:
                last_text = text
                await websocket.send_json({"type": "narration", "text": text})
    except WebSocketDisconnect:
        pass
    finally:
        recv_task.cancel()
