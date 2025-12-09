# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db
from .routers import auth as auth_router
from .routers import admin as admin_router
from .routers import subjects as subjects_router
from .routers import sessions as sessions_router
from .routers import kiosk as kiosk_router
from .routers import attendance as attendance_router

app = FastAPI(title="Face Attendance API")
init_db()

# CORS setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,          # or ["*"] during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers (all paths remain identical)
app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(subjects_router.router)
app.include_router(sessions_router.router)
app.include_router(kiosk_router.router)
app.include_router(attendance_router.router)
