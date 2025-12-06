from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AttendanceRecordResponse(BaseModel):
    id: int
    student_id: int
    session_id: int
    status: str
    marked_at: Optional[datetime]

    class Config:
        orm_mode = True


class ManualAttendanceRequest(BaseModel):
    enrollmentNo: str
    subject: str
    date: str  # "YYYY-MM-DD"
    status: str
