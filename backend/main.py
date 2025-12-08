# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, Header, status, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from .db import SessionLocal, init_db
from . import models, schemas, auth, face_service, config
from .models import User, RoleEnum, FaceEmbedding, Subject, ClassSession, AttendanceRecord, CourseEnrollment
from .auth import hash_password, verify_password, create_access_token
from .schemas import UserCreate, UserOut, StartSessionByCode, RecognizeIn, SubjectOut
from typing import List, Optional
import base64, io, csv
from datetime import datetime, timedelta
from jose import jwt
from passlib.context import CryptContext
from .config import JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

app = FastAPI(title="Face Attendance API")
init_db()

# CORS setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # or ["*"] during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
def login(
    identifier: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(
        (User.email == identifier) | (User.enrollment_no == identifier)
    ).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id))

    # attach subject_ids
    enrolls = db.query(CourseEnrollment).filter_by(user_id=user.id).all()
    user_dict = UserOut.from_orm(user).dict()
    user_dict["subject_ids"] = [str(e.subject_id) for e in enrolls]

    return {"access_token": token, "token_type": "bearer", "user": user_dict}

@app.get("/api/auth/me")
def me(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    enrolls = db.query(CourseEnrollment).filter_by(user_id=user.id).all()
    subject_ids = [str(e.subject_id) for e in enrolls]

    return {
        "user": UserOut(
            id=str(user.id),
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            enrollment_no=user.enrollment_no,
            semester=user.semester,
            created_at=user.created_at,
            subject_ids=subject_ids,
        )
    }


# ----------------
# Admin: create user
# ----------------
@app.post("/api/admin/users", response_model=UserOut)
def create_user(in_user: UserCreate, db: Session = Depends(get_db)):
    # 1) Check email uniqueness
    existing_email = db.query(User).filter(User.email == in_user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="email exists")

    # 2) Check enrollment_no uniqueness ONLY if provided & not empty
    if in_user.enrollment_no not in (None, "", "null"):
        existing_enroll = (
            db.query(User)
            .filter(User.enrollment_no == in_user.enrollment_no)
            .first()
        )
        if existing_enroll:
            raise HTTPException(status_code=400, detail="enrollment_no exists")

    user = User(
        email=in_user.email,
        enrollment_no=in_user.enrollment_no,
        password_hash=hash_password(in_user.password),
        full_name=in_user.full_name,
        role=in_user.role,
        semester=in_user.semester,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/admin/users")
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    result = []
    for u in users:
        base = UserOut.from_orm(u).dict()
        enrolls = db.query(CourseEnrollment).filter_by(user_id=u.id).all()
        base["subject_ids"] = [str(e.subject_id) for e in enrolls]
        result.append(base)
    return result



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

@app.post("/api/admin/enroll-subject")
def enroll_subject(
    enrollment_no: str = Form(...),
    subject_code: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Link a user (student or faculty) to a subject via CourseEnrollment.
    Called from frontend when admin assigns subjects.
    """
    user = db.query(User).filter_by(enrollment_no=enrollment_no).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"user with enrollment_no '{enrollment_no}' not found",
        )

    subject = db.query(Subject).filter_by(code=subject_code).first()
    if not subject:
        raise HTTPException(
            status_code=404,
            detail=f"subject with code '{subject_code}' not found",
        )

    # Avoid duplicate enrollments
    existing = (
        db.query(CourseEnrollment)
        .filter_by(user_id=user.id, subject_id=subject.id)
        .first()
    )
    if existing:
        return {
            "status": "already_enrolled",
            "user_id": str(user.id),
            "subject_id": str(subject.id),
        }

    ce = CourseEnrollment(user_id=user.id, subject_id=subject.id)
    db.add(ce)
    db.commit()
    db.refresh(ce)

    return {
        "status": "enrolled",
        "user_id": str(user.id),
        "subject_id": str(subject.id),
    }


@app.post("/api/sessions/start")
def start_session_by_code(payload: StartSessionByCode, db: Session = Depends(get_db)):
    """
    Start a class session by providing a subject_code (not subject UUID).

    Rules:
    - Subject must exist.
    - This faculty CANNOT have another active session at the same time
      (no matter which subject).
    """
    # 1) Find subject by code
    subject = db.query(Subject).filter_by(code=payload.subject_code).first()
    if not subject:
        raise HTTPException(
            status_code=404,
            detail=f"subject with code '{payload.subject_code}' not found",
        )

    # 2) Ensure faculty is not already running any active session
    if payload.faculty_id:
        existing_any = (
            db.query(ClassSession)
            .filter(
                ClassSession.faculty_id == payload.faculty_id,
                ClassSession.is_active == True,
            )
            .first()
        )
        if existing_any:
            raise HTTPException(
                status_code=400,
                detail="You already have an active session. End it before starting a new one.",
            )

    # 3) Create the new session
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

    # 4) Return shape that matches what frontend will normalize
    return {
        "id": str(cs.id),
        "subject_id": str(subject.id),
        "subject_code": subject.code,
        "faculty_id": str(cs.faculty_id) if cs.faculty_id else None,
        "start_time": cs.start_time,
        "end_time": cs.end_time,
        "is_active": cs.is_active,
    }



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
    """
    Return all sessions that are currently marked as active.

    We rely on the explicit is_active flag:
    - set to True when /api/sessions/start is called
    - set to False when /api/sessions/{session_id}/end is called
    """
    rows = db.query(ClassSession).filter(ClassSession.is_active == True).all()

    return [
        {
            "id": str(r.id),
            "subject_id": str(r.subject_id),
            "faculty_id": str(r.faculty_id) if r.faculty_id else None,
            "start_time": r.start_time,
            "end_time": r.end_time,
            "is_active": r.is_active,
        }
        for r in rows
    ]

# ----------------
# Sessions listing
# ----------------
@app.get("/api/sessions")
def list_sessions(db: Session = Depends(get_db)):
    """
    Return all class sessions (active + completed).
    """
    rows = db.query(ClassSession).all()
    return [
        {
            "id": str(r.id),
            "subject_id": str(r.subject_id),
            "faculty_id": str(r.faculty_id) if r.faculty_id else None,
            "start_time": r.start_time,
            "end_time": r.end_time,
            "is_active": r.is_active,
        }
        for r in rows
    ]


# ----------------
# Kiosk recognize
# ----------------
@app.post("/api/kiosk/mark-attendance")
async def kiosk_mark_attendance(
    session_id: str = Form(...),
    imageBase64: str = Form(...),
    db: Session = Depends(get_db),
):
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

    # ---------- Save probe image safely ----------
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    probe_path = config.PROBES_DIR / f"{session_id}_{ts}.jpg"

    try:
        # This helper decodes base64 and writes with cv2
        face_service.save_probe_image_from_b64(imageBase64, probe_path)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid imageBase64 data (not valid base64 image)",
        )

    # ---------- Compute embedding + bbox ----------
    embedding, bbox = face_service.get_embedding_from_b64(imageBase64)
    if embedding is None:
        # no face detected
        return JSONResponse({"status": "no_face"}, status_code=200)

    # Compare against stored student centroids (on-the-fly centroid per student)
    students = db.query(User).filter(User.role == RoleEnum.STUDENT).all()
    import numpy as np

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
        score = float(np.dot(probe_vec, c_norm))  # cosine since vectors normalized
        if score > best["score"]:
            best = {
                "student_id": s.id,
                "score": score,
                "name": s.full_name,
                "enrollment_no": s.enrollment_no,
            }

    # Decide match
    if best["student_id"] is None:
        return {"status": "no_embeddings"}

    if best["score"] >= config.MATCH_SIMILARITY_THRESHOLD:
        # Check if student is enrolled in this session's subject
        enrolled = (
            db.query(CourseEnrollment)
            .filter_by(user_id=best["student_id"], subject_id=session.subject_id)
            .first()
        )
        if not enrolled:
            # recognized but not in this subject
            return {
                "status": "not_enrolled",
                "student_id": str(best["student_id"]),
                "enrollment_no": best.get("enrollment_no"),
                "score": best["score"],
            }

        # Avoid duplicate attendance for same session + student
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
        # below threshold
        return {
            "status": "unresolved",
            "top_score": best["score"],
            "probes": str(probe_path),
        }
    
from typing import Optional

# ...

@app.get("/api/attendance")
def list_attendance(
    session_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    List attendance records.
    - If session_id is provided, return only that session's records.
    - Otherwise, return all attendance records.
    """
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
