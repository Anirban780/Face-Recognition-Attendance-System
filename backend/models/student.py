from sqlalchemy import Column, Integer, String, Integer
from sqlalchemy.orm import relationship

from database import Base
from .associations import student_subject_table


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    enrollment_no = Column(String, unique=True, index=True)
    photo_count = Column(Integer, default=0)

    subjects = relationship(
        "Subject",
        secondary=student_subject_table,
        back_populates="students",
    )

    attendance_records = relationship(
        "AttendanceRecord", back_populates="student", cascade="all, delete-orphan"
    )

    embeddings = relationship(
        "FaceEmbedding", back_populates="student", cascade="all, delete-orphan"
    )
