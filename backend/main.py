from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import (
    auth,
    students,
    faculties,
    subjects,
    sessions,
    recognition,
    attendance,
)
from services.face_service import face_service

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FaceAuth Attendance System",
    description="AI-powered face recognition attendance management system",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    face_service.load_model()


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "FaceAuth Attendance System",
        "version": "1.0.0",
    }


# Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(faculties.router)
app.include_router(subjects.router)
app.include_router(sessions.router)
app.include_router(recognition.router)
app.include_router(attendance.router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
