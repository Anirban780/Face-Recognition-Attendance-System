from pydantic import BaseModel
from datetime import date, time


class SessionCreate(BaseModel):
    subjectCode: str
    facultyId: int
    date: date
    startTime: time
    endTime: time
    isActive: bool = True


class SessionResponse(BaseModel):
    id: int
    subjectCode: str
    facultyId: int
    date: date
    startTime: time
    endTime: time
    isActive: bool

    class Config:
        orm_mode = True
