# backend/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str]
    role: Optional[str] = "STUDENT"
    enrollment_no: Optional[str]
    semester: Optional[int]

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str]
    role: str
    enrollment_no: Optional[str]
    semester: Optional[int]
    created_at: datetime
    subject_ids: List[str] = []

    class Config:
        from_attributes = True

class StartSessionByCode(BaseModel):
    subject_code: str
    start_time: datetime
    end_time: datetime
    faculty_id: Optional[str] = None

class RecognizeIn(BaseModel):
    session_id: UUID
    image_base64: str  # base64 encoded JPEG/PNG

class SubjectOut(BaseModel):
    id: UUID
    name: str
    code: str

    class Config:
        from_attributes = True
