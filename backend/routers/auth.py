from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from schemas.auth import LoginRequest, UserResponse
from models import Faculty, Student

router = APIRouter(prefix="/api", tags=["Auth"])


@router.post("/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    username_lower = request.username.lower()

    # Very simple demo auth
    if "admin" in username_lower:
        return UserResponse(
            id="1",
            name="Admin User",
            email="admin@college.edu",
            role="ADMIN",
            assignedSubjects=[],
        )

    if "faculty" in username_lower:
        faculty = db.query(Faculty).first()
        if faculty:
            subjects_codes = [s.code for s in faculty.subjects]
            return UserResponse(
                id=str(faculty.id),
                name=faculty.name,
                email=faculty.email,
                role="FACULTY",
                assignedSubjects=subjects_codes,
            )

    if "student" in username_lower:
        student = db.query(Student).first()
        if student:
            return UserResponse(
                id=str(student.id),
                name=student.name,
                email=student.email,
                role="STUDENT",
                assignedSubjects=None,
            )

    raise HTTPException(status_code=401, detail="Invalid credentials")
