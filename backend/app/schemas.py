"""Pydantic request/response models."""
from typing import Literal, Optional

from pydantic import BaseModel, Field


class DescribeRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded JPEG/PNG frame (no data-URI prefix)")
    mode: Literal["indoor", "outdoor"] = "outdoor"
    detail: Literal["brief", "standard", "detailed"] = "standard"


class OcrRequest(BaseModel):
    image_base64: str


class RadarRequest(BaseModel):
    image_base64: str


class DetectedObject(BaseModel):
    name: str
    direction: Literal["left", "right", "ahead", "behind"]
    distanceM: float
    note: Optional[str] = None


class TextResponse(BaseModel):
    text: str


class RadarResponse(BaseModel):
    objects: list[DetectedObject]
