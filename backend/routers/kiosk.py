# backend/routers/kiosk.py
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import base64
import numpy as np

from ..deps import get_db
from ..models import (
    User,
    RoleEnum,
    FaceEmbedding,
    ClassSession,
    AttendanceRecord,
    CourseEnrollment,
)
from .. import face_service, config

router = APIRouter(prefix="/api/kiosk", tags=["kiosk"])


@router.post("/mark-attendance")
async def kiosk_mark_attendance(
    session_id: str = Form(...),
    imageBase64: str = Form(...),
    db: Session = Depends(get_db),
):
    session = db.query(ClassSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    probe_path = config.PROBES_DIR / f"{session_id}_{ts}.jpg"

    try:
        face_service.save_probe_image_from_b64(imageBase64, probe_path)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid imageBase64 data (not valid base64 image)",
        )

    embedding, bbox = face_service.get_embedding_from_b64(imageBase64)
    if embedding is None:
        return JSONResponse({"status": "no_face"}, status_code=200)

    students = db.query(User).filter(User.role == RoleEnum.STUDENT).all()

    probe_vec = np.array(embedding)
    best = {"student_id": None, "score": -1.0, "name": None, "enrollment_no": None}
    for s in students:
        embs = db.query(FaceEmbedding).filter_by(user_id=s.id).all()
        if not embs:
            continue
        mat = np.array([e.embedding for e in embs])
        centroid = mat.mean(axis=0)
        denom = np.linalg.norm(centroid)
        if denom == 0:
            continue
        c_norm = centroid / denom
        score = float(np.dot(probe_vec, c_norm))
        if score > best["score"]:
            best = {
                "student_id": s.id,
                "score": score,
                "name": s.full_name,
                "enrollment_no": s.enrollment_no,
            }

    if best["student_id"] is None:
        return {"status": "no_embeddings"}

    if best["score"] >= config.MATCH_SIMILARITY_THRESHOLD:
        enrolled = (
            db.query(CourseEnrollment)
            .filter_by(user_id=best["student_id"], subject_id=session.subject_id)
            .first()
        )
        if not enrolled:
            return {
                "status": "not_enrolled",
                "student_id": str(best["student_id"]),
                "enrollment_no": best.get("enrollment_no"),
                "score": best["score"],
            }

        already = (
            db.query(AttendanceRecord)
            .filter_by(session_id=session_id, student_id=best["student_id"])
            .first()
        )
        if already:
            return {
                "status": "already_marked",
                "student_id": str(best["student_id"]),
                "score": best["score"],
            }

        att = AttendanceRecord(
            session_id=session_id,
            student_id=best["student_id"],
            status="PRESENT",
            confidence=str(best["score"]),
            image_path=str(probe_path),
        )
        db.add(att)
        db.commit()
        return {
            "status": "matched",
            "student_id": str(best["student_id"]),
            "name": best["name"],
            "enrollment_no": best.get("enrollment_no"),
            "score": best["score"],
        }
    else:
        return {
            "status": "unresolved",
            "top_score": best["score"],
            "probes": str(probe_path),
        }

@router.post("/mark-attendance-multicam")
async def kiosk_mark_attendance_multicam(
    session_id: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    """
    Accepts up to 4 frames (2 per webcam), runs face recognition on each, and
    marks attendance based on the BEST MATCH among all frames.
    """

    # ✓ Validate session
    session = db.query(ClassSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    # ✓ Load all students
    students = db.query(User).filter(User.role == RoleEnum.STUDENT).all()

    best_global = None  # store best match across ALL frames

    for uploaded in files:
        content = await uploaded.read()

        # convert to base64
        b64_str = base64.b64encode(content).decode("utf-8")

        # get embedding
        embedding, bbox = face_service.get_embedding_from_b64(b64_str)

        if embedding is None:
            # no face found, skip this frame
            continue

        probe_vec = np.array(embedding, dtype=np.float32)

        best_for_frame = {
            "student_id": None,
            "score": -1,
            "name": None,
            "enrollment_no": None,
            "b64": b64_str,
        }

        # loop through all students
        for student in students:
            if not student.face_embeddings or len(student.face_embeddings) == 0:
                continue

            try:
                embeddings_list = eval(student.face_embeddings)
            except Exception:
                continue

            if not isinstance(embeddings_list, list) or len(embeddings_list) == 0:
                continue

            # Compute centroid
            centroid = np.mean(np.array(embeddings_list), axis=0)

            # Compute similarity
            similarity = float(np.dot(probe_vec, centroid))

            # select the best result for this frame
            if similarity > best_for_frame["score"]:
                best_for_frame.update({
                    "student_id": student.id,
                    "score": similarity,
                    "name": student.name,
                    "enrollment_no": student.enrollment_no,
                })

        # update global best if this frame is better
        if best_for_frame["student_id"] and (
            best_global is None or best_for_frame["score"] > best_global["score"]
        ):
            best_global = best_for_frame

    # -------------------------------------------------------------------------
    # DONE PROCESSING ALL FRAMES — NOW DECIDE BASED ON GLOBAL BEST
    # -------------------------------------------------------------------------

    if best_global is None:
        return {"status": "no_face", "message": "No face detected in any frame"}

    student_id = best_global["student_id"]
    score = best_global["score"]
    name = best_global["name"]
    enr = best_global["enrollment_no"]

    student = db.query(User).filter_by(id=student_id).first()

    if not student:
        return {"status": "unresolved", "message": "Could not determine student identity"}

    if not student.is_enrolled:
        return {
            "status": "not_enrolled",
            "name": student.name,
            "enrollment_no": student.enrollment_no,
        }

    # Check if already marked
    existing = db.query(AttendanceRecord).filter_by(
        class_session_id=session_id, student_id=student.id
    ).first()

    if existing:
        return {
            "status": "already_marked",
            "name": student.name,
            "enrollment_no": student.enrollment_no,
        }

    # threshold check
    if score < config.MATCH_SIMILARITY_THRESHOLD:
        return {
            "status": "unresolved",
            "name": student.name,
            "enrollment_no": student.enrollment_no,
            "score": score,
        }

    # -------------------------------------------------------------------------
    # MARK ATTENDANCE
    # -------------------------------------------------------------------------
    record = AttendanceRecord(
        student_id=student.id,
        class_session_id=session_id,
        marked_by=None,
        method="kiosk_multi_cam",
        timestamp=datetime.utcnow(),
        probe_image_base64=best_global["b64"],
        face_location=None,
        similarity_score=score,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "status": "matched",
        "name": student.name,
        "enrollment_no": student.enrollment_no,
        "score": score,
    }


