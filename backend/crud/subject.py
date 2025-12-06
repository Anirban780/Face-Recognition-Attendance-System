from sqlalchemy.orm import Session

from models import Subject
from schemas.subject import SubjectCreate


def create_subject(db: Session, data: SubjectCreate) -> Subject:
    subject = Subject(code=data.code, name=data.name)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def get_subjects(db: Session):
    return db.query(Subject).all()


def get_subject_by_code(db: Session, code: str):
    return db.query(Subject).filter(Subject.code == code).first()
