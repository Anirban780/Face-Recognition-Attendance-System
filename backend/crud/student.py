from sqlalchemy.orm import Session

from models import Student
from schemas.student import StudentCreate


def create_student(db: Session, data: StudentCreate) -> Student:
    student = Student(
        name=data.name,
        email=data.email,
        enrollment_no=data.enrollmentNo,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


def get_students(db: Session):
    return db.query(Student).all()


def get_student_by_id(db: Session, student_id: int):
    return db.query(Student).filter(Student.id == student_id).first()


def get_student_by_enrollment(db: Session, enrollment_no: str):
    return db.query(Student).filter(Student.enrollment_no == enrollment_no).first()
