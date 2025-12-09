# backend/routers/attendance.py
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
import csv

from ..deps import get_db
from ..models import AttendanceRecord

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.get("")
def list_attendance(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(AttendanceRecord)
    if session_id:
        q = q.filter(AttendanceRecord.session_id == session_id)

    rows = q.all()
    return [
        {
            "id": str(r.id),
            "session_id": str(r.session_id),
            "student_id": str(r.student_id),
            "timestamp": r.timestamp,
            "status": r.status,
            "confidence": r.confidence,
        }
        for r in rows
    ]


@router.get("/export")
def export_attendance(session_id: str, db: Session = Depends(get_db)):
    rows = db.query(AttendanceRecord).filter_by(session_id=session_id).all()

    def iter_csv():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["student_id", "timestamp", "status", "confidence"])
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)
        for r in rows:
            writer.writerow(
                [
                    str(r.student_id),
                    r.timestamp.isoformat(),
                    r.status,
                    r.confidence,
                ]
            )
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=attendance_{session_id}.csv"
        },
    )
