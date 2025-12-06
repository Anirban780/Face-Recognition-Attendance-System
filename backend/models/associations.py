from sqlalchemy import Table, Column, Integer, ForeignKey
from database import Base

student_subject_table = Table(
    "student_subjects",
    Base.metadata,
    Column("student_id", Integer, ForeignKey("students.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)

faculty_subject_table = Table(
    "faculty_subjects",
    Base.metadata,
    Column("faculty_id", Integer, ForeignKey("faculties.id"), primary_key=True),
    Column("subject_id", Integer, ForeignKey("subjects.id"), primary_key=True),
)
