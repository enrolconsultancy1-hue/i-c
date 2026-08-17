from fastapi import APIRouter

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
