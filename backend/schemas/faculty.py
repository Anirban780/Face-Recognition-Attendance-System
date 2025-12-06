from pydantic import BaseModel, EmailStr
from typing import List


class FacultyCreate(BaseModel):
    name: str
    email: EmailStr


class FacultyResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    assignedSubjects: List[str] = []

    class Config:
        orm_mode = True
