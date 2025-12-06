# schemas/__init__.py
from .auth import LoginRequest, UserResponse
from .student import StudentCreate, StudentResponse
from .faculty import FacultyCreate, FacultyResponse
from .subject import SubjectCreate, SubjectResponse
from .session import SessionCreate, SessionResponse
from .attendance import (
    AttendanceRecordResponse,
    ManualAttendanceRequest,
)
from .recognition import (
    RecognitionResponse,
    TrainModelResponse,
)

__all__ = [
    "LoginRequest",
    "UserResponse",
    "StudentCreate",
    "StudentResponse",
    "FacultyCreate",
    "FacultyResponse",
    "SubjectCreate",
    "SubjectResponse",
    "SessionCreate",
    "SessionResponse",
    "AttendanceRecordResponse",
    "ManualAttendanceRequest",
    "RecognitionResponse",
    "TrainModelResponse",
]
