from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base
from .associations import student_subject_table, faculty_subject_table


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)

    students = relationship(
        "Student",
        secondary=student_subject_table,
        back_populates="subjects",
    )

    faculties = relationship(
        "Faculty",
        secondary=faculty_subject_table,
        back_populates="subjects",
    )

    sessions = relationship(
        "AttendanceSession", back_populates="subject", cascade="all, delete-orphan"
    )
