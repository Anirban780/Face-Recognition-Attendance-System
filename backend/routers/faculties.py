from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.faculty import FacultyCreate, FacultyResponse
from crud import create_faculty, get_faculties

router = APIRouter(prefix="/api/faculties", tags=["Faculties"])


@router.get("", response_model=list[FacultyResponse])
def list_faculties(db: Session = Depends(get_db)):
    faculties = get_faculties(db)
    response: list[FacultyResponse] = []
    for f in faculties:
        response.append(
            FacultyResponse(
                id=f.id,
                name=f.name,
                email=f.email,
                assignedSubjects=[s.code for s in f.subjects],
            )
        )
    return response


@router.post("", response_model=FacultyResponse)
def add_faculty(faculty_data: FacultyCreate, db: Session = Depends(get_db)):
    faculty = create_faculty(db, faculty_data)
    return FacultyResponse(
        id=faculty.id,
        name=faculty.name,
        email=faculty.email,
        assignedSubjects=[s.code for s in faculty.subjects],
    )
