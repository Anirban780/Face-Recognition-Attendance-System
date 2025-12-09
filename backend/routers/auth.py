# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, Form, Header
from sqlalchemy.orm import Session
from jose import jwt

from ..models import User, CourseEnrollment
from ..schemas import UserOut
from ..auth import verify_password, create_access_token
from .. import config
from ..deps import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(
    identifier: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter((User.email == identifier) | (User.enrollment_no == identifier))
        .first()
    )
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(str(user.id))

    enrolls = db.query(CourseEnrollment).filter_by(user_id=user.id).all()
    user_dict = UserOut.from_orm(user).dict()
    user_dict["subject_ids"] = [str(e.subject_id) for e in enrolls]

    return {"access_token": token, "token_type": "bearer", "user": user_dict}


@router.get("/me")
def me(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM]
        )
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
