from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas.session import SessionCreate, SessionResponse
from crud import create_session, get_sessions

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


@router.get("", response_model=list[SessionResponse])
def list_sessions(db: Session = Depends(get_db)):
    sessions = get_sessions(db)
    result: list[SessionResponse] = []
    for s in sessions:
        result.append(
            SessionResponse(
                id=s.id,
                subjectCode=s.subject.code,
                facultyId=s.faculty_id,
                date=s.date,
                startTime=s.start_time,
                endTime=s.end_time,
                isActive=s.is_active,
            )
        )
    return result


@router.post("", response_model=SessionResponse)
def create_attendance_session(
    session_data: SessionCreate, db: Session = Depends(get_db)
):
    try:
        session = create_session(db, session_data)
        return SessionResponse(
            id=session.id,
            subjectCode=session.subject.code,
            facultyId=session.faculty_id,
            date=session.date,
            startTime=session.start_time,
            endTime=session.end_time,
            isActive=session.is_active,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
