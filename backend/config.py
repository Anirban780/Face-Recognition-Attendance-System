# backend/config.py
from pathlib import Path
import os
from dotenv import load_dotenv

ROOT = Path(__file__).parent
env_path = ROOT / ".env"
if env_path.exists():
    load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:anirban%40780@localhost:5432/attendance_db")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretreplace")  # change in production
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

STORAGE_ROOT = Path(os.getenv("STORAGE_ROOT", str(ROOT / "storage"))).resolve()
STORAGE_ROOT.mkdir(parents=True, exist_ok=True)
RAW_DIR = STORAGE_ROOT / "raw"
CROPS_DIR = STORAGE_ROOT / "crops"
PROBES_DIR = STORAGE_ROOT / "probes"
MODELS_DIR = STORAGE_ROOT / "models"

# Recognition settings
MATCH_SIMILARITY_THRESHOLD = float(os.getenv("MATCH_SIMILARITY_THRESHOLD", "0.65"))  # cosine similarity
MIN_SAMPLES_PER_STUDENT = int(os.getenv("MIN_SAMPLES_PER_STUDENT", "8"))

# Ensure folders exist
for d in (RAW_DIR, CROPS_DIR, PROBES_DIR, MODELS_DIR):
    d.mkdir(parents=True, exist_ok=True)
