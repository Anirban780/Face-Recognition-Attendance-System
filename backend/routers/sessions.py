# backend/routers/sessions.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..deps import get_db
from ..models import ClassSession, Subject
from ..schemas import StartSessionByCode
from datetime import datetime, timezone
from sqlalchemy import or_

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


from sqlalchemy import or_
from datetime import datetime, timezone

@router.post("/start")
def start_session_by_code(
    payload: StartSessionByCode, db: Session = Depends(get_db)
):
    subject = db.query(Subject).filter_by(code=payload.subject_code).first()
    if not subject:
        raise HTTPException(
            status_code=404,
            detail=f"subject with code '{payload.subject_code}' not found",
        )

    if payload.faculty_id:
        now = datetime.now(timezone.utc)

        existing_any = (
            db.query(ClassSession)
            .filter(
                ClassSession.faculty_id == payload.faculty_id,
                ClassSession.is_active == True,
                or_(
                    ClassSession.end_time == None,
                    ClassSession.end_time > now,
                ),
            )
            .first()
        )

        if existing_any:
            raise HTTPException(
                status_code=400,
                detail="You already have an active session. End it before starting a new one.",
            )

    cs = ClassSession(
        subject_id=subject.id,
        faculty_id=payload.faculty_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_active=True,
    )
    db.add(cs)
    db.commit()
    db.refresh(cs)

    return {
        "id": str(cs.id),
        "subject_id": str(subject.id),
        "subject_code": subject.code,
        "faculty_id": str(cs.faculty_id) if cs.faculty_id else None,
        "start_time": cs.start_time,
        "end_time": cs.end_time,
        "is_active": cs.is_active,
    }



@router.post("/{session_id}/end")
def end_session(session_id: str, db: Session = Depends(get_db)):
    cs = db.query(ClassSession).filter_by(id=session_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="session not found")
    cs.is_active = False
    db.add(cs)
    db.commit()
    return {"ok": True}


@router.get("/active")
def active_sessions(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)

    rows = (
        db.query(ClassSession)
        .filter(
            ClassSession.is_active == True,
            or_(
                ClassSession.end_time == None,
                ClassSession.end_time > now,
            ),
        )
        .all()
    )

    return [
        {
            "id": str(r.id),
            "subject_id": str(r.subject_id),
            "faculty_id": str(r.faculty_id) if r.faculty_id else None,
            "start_time": r.start_time,
            "end_time": r.end_time,
            "is_active": True,  # only true if also not expired
        }
        for r in rows
    ]


@router.get("")
def list_sessions(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    rows = db.query(ClassSession).all()
    result = []

    for r in rows:
        # derive "active" from flag + time
        is_active = bool(r.is_active) and (
            r.end_time is None or r.end_time > now
        )
        result.append(
            {
                "id": str(r.id),
                "subject_id": str(r.subject_id),
                "faculty_id": str(r.faculty_id) if r.faculty_id else None,
                "start_time": r.start_time,
                "end_time": r.end_time,
                "is_active": is_active,
            }
        )

    return result

