# schemas/recognition.py
from pydantic import BaseModel
from typing import Optional


class RecognitionResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    student: Optional[str] = None
    enrollmentNo: Optional[str] = None


class TrainModelResponse(BaseModel):
    message: str
    faces_encoded: int
