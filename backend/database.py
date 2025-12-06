from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Change to your real connection string
DATABASE_URL = "postgresql://postgres:anirban%40780@localhost:5432/attendance_db"

engine = create_engine(DATABASE_URL, future=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
