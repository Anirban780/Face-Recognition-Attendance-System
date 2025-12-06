from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database import Base
from .associations import faculty_subject_table


class Faculty(Base):
    __tablename__ = "faculties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)

    subjects = relationship(
        "Subject",
        secondary=faculty_subject_table,
        back_populates="faculties",
    )

    sessions = relationship(
        "AttendanceSession", back_populates="faculty", cascade="all, delete-orphan"
    )
