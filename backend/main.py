# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from .db import SessionLocal, init_db
from . import models, schemas, auth, face_service, config
from .models import User, RoleEnum, FaceEmbedding, Subject, ClassSession, AttendanceRecord, CourseEnrollment
from .auth import hash_password, verify_password, create_access_token
from .schemas import UserCreate, UserOut, StartSessionByCode, RecognizeIn, SubjectOut
from typing import List, Optional
import base64, io, csv
from datetime import datetime

app = FastAPI(title="Face Attendance API")
init_db()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------
# AUTH (simple)
# ----------------
@app.post("/api/auth/login")
def login(identifier: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    # identifier can be email or enrollment_no
    user = db.query(User).filter((User.email == identifier) | (User.enrollment_no == identifier)).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return {"access_token": token, "token_type": "bearer", "user": UserOut.from_orm(user)}

@app.get("/api/auth/me")
def me(token: str = Form(None)):
    # For simplicity in MVP: return nothing — in real app use JWT dependency
    return {"msg": "implement JWT dependency in production"}

# ----------------
# Admin: create user
# ----------------
@app.post("/api/admin/users", response_model=UserOut)
def create_user(in_user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter((User.email == in_user.email) | (User.enrollment_no == in_user.enrollment_no)).first()
    if existing:
        raise HTTPException(status_code=400, detail="user exists")
    user = User(
        email=in_user.email,
        enrollment_no=in_user.enrollment_no,
        password_hash=hash_password(in_user.password),
        full_name=in_user.full_name,
        role=in_user.role,
        semester=in_user.semester
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    # enroll into subjects if provided? (extend later)
    return user

@app.get("/api/admin/users", response_model=List[UserOut])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

# ----------------
# Admin: upload images to create embeddings
# ----------------
# Admin: upload images to create embeddings by enrollment_no
@app.post("/api/admin/train-face")
async def train_face(enrollment_no: str = Form(...), files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    """
    Accepts enrollment_no and multiple image files.
    For each image: save raw, detect & embed via insightface, persist FaceEmbedding rows.
    Returns counts of accepted/rejected images.
    """
    user = db.query(User).filter_by(enrollment_no=enrollment_no).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"user with enrollment_no '{enrollment_no}' not found")

    accepted = 0
    rejected = 0
    for up in files:
        content = await up.read()
        # Save raw file
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        raw_path = config.RAW_DIR / f"{enrollment_no}_{ts}_{up.filename}"
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        with open(raw_path, "wb") as f:
            f.write(content)

        # convert to base64 and get embedding
        b64 = base64.b64encode(content).decode("utf-8")
        embedding, bbox = face_service.get_embedding_from_b64(b64)
        if embedding is None:
            rejected += 1
            continue

        # persist embedding
        fe = FaceEmbedding(user_id=user.id, embedding=embedding, image_path=str(raw_path))
        db.add(fe)
        accepted += 1

    db.commit()
    return {"accepted": accepted, "rejected": rejected, "enrollment_no": enrollment_no}


# ----------------
# Subjects & sessions
# ----------------
@app.post("/api/admin/subjects")
def create_subject(name: str = Form(...), code: str = Form(...), db: Session = Depends(get_db)):
    s = Subject(name=name, code=code)
    db.add(s); db.commit(); db.refresh(s)
    return {"id": str(s.id), "name": s.name, "code": s.code}

@app.get("/api/subjects", response_model=List[SubjectOut])
def list_all_subjects(db: Session = Depends(get_db)):
    """
    Return all subjects in the database.
    No filtering. No pagination.
    """
    subjects = db.query(Subject).all()
    return subjects

@app.post("/api/sessions/start")
def start_session_by_code(payload: StartSessionByCode, db: Session = Depends(get_db)):
    """
    Start a class session by providing a subject_code (not subject UUID).
    Looks up subject by code, then creates the ClassSession record.
    """
    subject = db.query(Subject).filter_by(code=payload.subject_code).first()
    if not subject:
        raise HTTPException(status_code=404, detail=f"subject with code '{payload.subject_code}' not found")

    cs = ClassSession(
        subject_id=subject.id,
        faculty_id=payload.faculty_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_active=True
    )
    db.add(cs)
    db.commit()
    db.refresh(cs)
    return {"id": str(cs.id), "subject_code": payload.subject_code, "subject_id": str(subject.id)}

@app.post("/api/sessions/{session_id}/end")
def end_session(session_id: str, db: Session = Depends(get_db)):
    cs = db.query(ClassSession).filter_by(id=session_id).first()
    if not cs:
        raise HTTPException(status_code=404, detail="session not found")
    cs.is_active = False
    db.add(cs); db.commit()
    return {"ok": True}

@app.get("/api/sessions/active")
def active_sessions(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    rows = db.query(ClassSession).filter(ClassSession.is_active == True, ClassSession.start_time <= now, ClassSession.end_time >= now).all()
    return [{"id": str(r.id), "subject_id": str(r.subject_id), "start_time": r.start_time, "end_time": r.end_time} for r in rows]

# ----------------
# Kiosk recognize
# ----------------
@app.post("/api/kiosk/mark-attendance")
async def kiosk_mark_attendance(session_id: str = Form(...), imageBase64: str = Form(...), db: Session = Depends(get_db)):
    """
    Kiosk sends a base64 image + session_id.
    We compute embedding, find best-matching student, then:
      - check if matched student is enrolled in the session's subject
      - if enrolled -> write AttendanceRecord
      - else -> return status 'not_enrolled' (no attendance created)
    """
    # Validate session exists
    session = db.query(ClassSession).filter_by(id=session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="session not found")

    # Save probe
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    probe_path = config.PROBES_DIR / f"{session_id}_{ts}.jpg"
    probe_path.parent.mkdir(parents=True, exist_ok=True)
    if imageBase64.startswith("data:"):
        imageBase64 = imageBase64.split(",", 1)[1]
    with open(probe_path, "wb") as f:
        f.write(base64.b64decode(imageBase64))

    # compute embedding + bbox
    embedding, bbox = face_service.get_embedding_from_b64(imageBase64)
    if embedding is None:
        # no face detected
        return JSONResponse({"status": "no_face"}, status_code=200)

    # Compare against stored student centroids (on-the-fly centroid per student)
    students = db.query(User).filter(User.role == RoleEnum.STUDENT).all()
    import numpy as np
    probe_vec = np.array(embedding)
    best = {"student_id": None, "score": -1.0, "name": None}
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
        score = float(np.dot(probe_vec, c_norm))  # cosine since vectors normalized
        if score > best["score"]:
            best = {"student_id": s.id, "score": score, "name": s.full_name, "enrollment_no": s.enrollment_no}

    # Decide match
    if best["student_id"] is None:
        return {"status": "no_embeddings"}

    if best["score"] >= config.MATCH_SIMILARITY_THRESHOLD:
        # Check if student is enrolled in this session's subject
        enrolled = db.query(CourseEnrollment).filter_by(user_id=best["student_id"], subject_id=session.subject_id).first()
        if not enrolled:
            # Student recognized but not enrolled in the subject
            # return unresolved/not_enrolled so faculty can decide; do not create attendance row
            return {"status": "not_enrolled", "student_id": str(best["student_id"]), "enrollment_no": best.get("enrollment_no"), "score": best["score"]}

        # Create attendance record (avoid duplicates for same session + student)
        already = db.query(AttendanceRecord).filter_by(session_id=session_id, student_id=best["student_id"]).first()
        if already:
            return {"status": "already_marked", "student_id": str(best["student_id"]), "score": best["score"]}

        att = AttendanceRecord(
            session_id=session_id,
            student_id=best["student_id"],
            status="PRESENT",
            confidence=str(best["score"]),
            image_path=str(probe_path)
        )
        db.add(att)
        db.commit()
        return {"status": "matched", "student_id": str(best["student_id"]), "name": best["name"], "score": best["score"]}
    else:
        # Best match is below threshold -> return unresolved with top score for inspection
        return {"status": "unresolved", "top_score": best["score"], "probes": str(probe_path)}


# ----------------
# Attendance export
# ----------------
@app.get("/api/attendance/export")
def export_attendance(session_id: str, db: Session = Depends(get_db)):
    rows = db.query(AttendanceRecord).filter_by(session_id=session_id).all()
    def iter_csv():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(["student_id", "timestamp", "status", "confidence"])
        yield buffer.getvalue()
        buffer.seek(0); buffer.truncate(0)
        for r in rows:
            writer.writerow([str(r.student_id), r.timestamp.isoformat(), r.status, r.confidence])
            yield buffer.getvalue()
            buffer.seek(0); buffer.truncate(0)
    return StreamingResponse(iter_csv(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=attendance_{session_id}.csv"})
