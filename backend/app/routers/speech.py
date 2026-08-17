from fastapi import APIRouter

from ..schemas import TextResponse, TranscribeRequest
from ..services import gemini

router = APIRouter()


@router.post("/transcribe", response_model=TextResponse)
async def transcribe(req: TranscribeRequest):
    text = await gemini.transcribe(req.audio_base64, req.mime_type)
    return TextResponse(text=text)
