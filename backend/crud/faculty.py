from sqlalchemy.orm import Session

from models import Faculty
from schemas.faculty import FacultyCreate


def create_faculty(db: Session, data: FacultyCreate) -> Faculty:
    faculty = Faculty(name=data.name, email=data.email)
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


def get_faculties(db: Session):
    return db.query(Faculty).all()
