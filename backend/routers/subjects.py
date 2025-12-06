from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.subject import SubjectCreate, SubjectResponse
from crud import create_subject, get_subjects

router = APIRouter(prefix="/api/subjects", tags=["Subjects"])


@router.get("", response_model=list[SubjectResponse])
def list_subjects(db: Session = Depends(get_db)):
    return get_subjects(db)


@router.post("", response_model=SubjectResponse)
def add_subject(subject_data: SubjectCreate, db: Session = Depends(get_db)):
    return create_subject(db, subject_data)
