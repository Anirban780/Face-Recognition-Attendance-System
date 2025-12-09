# backend/routers/admin.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import base64

from ..deps import get_db
from ..models import (
    User,
    RoleEnum,
    FaceEmbedding,
    Subject,
    CourseEnrollment,
)
from ..schemas import UserCreate, UserOut
from ..auth import hash_password
from .. import face_service, config

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/users", response_model=UserOut)
def create_user(in_user: UserCreate, db: Session = Depends(get_db)):
    existing_email = db.query(User).filter(User.email == in_user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="email exists")

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


@router.get("/users")
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    result = []
    for u in users:
        base = UserOut.from_orm(u).dict()
        enrolls = db.query(CourseEnrollment).filter_by(user_id=u.id).all()
        base["subject_ids"] = [str(e.subject_id) for e in enrolls]
        result.append(base)
    return result


@router.post("/train-face")
async def train_face(
    enrollment_no: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter_by(enrollment_no=enrollment_no).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"user with enrollment_no '{enrollment_no}' not found",
        )

    accepted = 0
    rejected = 0
    for up in files:
        content = await up.read()
        ts = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
        raw_path = config.RAW_DIR / f"{enrollment_no}_{ts}_{up.filename}"
        raw_path.parent.mkdir(parents=True, exist_ok=True)
        with open(raw_path, "wb") as f:
            f.write(content)

        b64 = base64.b64encode(content).decode("utf-8")
        embedding, bbox = face_service.get_embedding_from_b64(b64)
        if embedding is None:
            rejected += 1
            continue

        fe = FaceEmbedding(
            user_id=user.id, embedding=embedding, image_path=str(raw_path)
        )
        db.add(fe)
        accepted += 1

    db.commit()
    return {
        "accepted": accepted,
        "rejected": rejected,
        "enrollment_no": enrollment_no,
    }


@router.post("/subjects")
def create_subject(
    name: str = Form(...), code: str = Form(...), db: Session = Depends(get_db)
):
    s = Subject(name=name, code=code)
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": str(s.id), "name": s.name, "code": s.code}


@router.post("/enroll-subject")
def enroll_subject(
    enrollment_no: str = Form(...),
    subject_code: str = Form(...),
    db: Session = Depends(get_db),
):
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
