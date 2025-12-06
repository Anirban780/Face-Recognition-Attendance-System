from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from schemas.attendance import (
    AttendanceRecordResponse,
    ManualAttendanceRequest,
)
from crud import (
    get_attendance_by_student,
    get_attendance_by_session,
    update_attendance_status,
    get_student_by_enrollment,
)
from models import AttendanceRecord, AttendanceSession, Subject

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.get("/history", response_model=list[AttendanceRecordResponse])
def get_attendance_history(
    enrollmentNo: str | None = None, db: Session = Depends(get_db)
):
    if enrollmentNo:
        student = get_student_by_enrollment(db, enrollmentNo)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        records = get_attendance_by_student(db, student.id)
    else:
        records = db.query(AttendanceRecord).all()
    return records


@router.get("/session")
def get_session_attendance(subject: str, date: str, db: Session = Depends(get_db)):
    records = get_attendance_by_session(db, subject, date)
    # You can shape this into whatever format your frontend expects
    result = []
    for r in records:
        result.append(
            {
                "student_id": r.student_id,
                "session_id": r.session_id,
                "status": r.status,
                "marked_at": r.marked_at,
            }
        )
    return result


@router.post("/manual")
def manual_attendance_update(
    request: ManualAttendanceRequest, db: Session = Depends(get_db)
):
    try:
        student = get_student_by_enrollment(db, request.enrollmentNo)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")

        session_date = datetime.strptime(request.date, "%Y-%m-%d").date()

        session = (
            db.query(AttendanceSession)
            .join(Subject, AttendanceSession.subject_id == Subject.id)
            .filter(Subject.name == request.subject, AttendanceSession.date == session_date)
            .first()
        )
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        update_attendance_status(db, student.id, session.id, request.status)
        return {"message": "Attendance updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
