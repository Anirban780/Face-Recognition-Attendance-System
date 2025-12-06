from sqlalchemy.orm import Session
from datetime import date

from models import AttendanceSession
from schemas.session import SessionCreate
from .subject import get_subject_by_code
from models import Faculty


def create_session(db: Session, data: SessionCreate) -> AttendanceSession:
    subject = get_subject_by_code(db, data.subjectCode)
    if not subject:
        raise ValueError("Subject not found")

    faculty = db.query(Faculty).filter(Faculty.id == data.facultyId).first()
    if not faculty:
        raise ValueError("Faculty not found")

    session = AttendanceSession(
        subject_id=subject.id,
        faculty_id=faculty.id,
        date=data.date,
        start_time=data.startTime,
        end_time=data.endTime,
        is_active=data.isActive,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_sessions(db: Session):
    return db.query(AttendanceSession).all()


def get_active_sessions(db: Session):
    return db.query(AttendanceSession).filter(AttendanceSession.is_active == True).all()
