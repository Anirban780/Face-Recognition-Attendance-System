from sqlalchemy.orm import Session
from datetime import datetime, date as date_type

from models import AttendanceRecord, AttendanceSession, Subject, Student


def create_attendance_record(
    db: Session, student_id: int, session_id: int, status: str = "Present"
) -> AttendanceRecord:
    record = AttendanceRecord(
        student_id=student_id,
        session_id=session_id,
        status=status,
        marked_at=datetime.now(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def check_existing_attendance(db: Session, student_id: int, session_id: int):
    return (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id == session_id,
        )
        .first()
    )


def get_attendance_by_student(db: Session, student_id: int):
    return db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student_id).all()


def get_attendance_by_session(db: Session, subject_code: str, date_str: str):
    session_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    return (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .join(Subject, AttendanceSession.subject_id == Subject.id)
        .filter(Subject.code == subject_code, AttendanceSession.date == session_date)
        .all()
    )


def update_attendance_status(
    db: Session, student_id: int, session_id: int, status: str
):
    record = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id == session_id,
        )
        .first()
    )
    if record:
        record.status = status
    else:
        record = AttendanceRecord(
            student_id=student_id,
            session_id=session_id,
            status=status,
            marked_at=datetime.now(),
        )
        db.add(record)
    db.commit()
    return record
