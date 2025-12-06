# routers/students.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import numpy as np
import cv2

from database import get_db
from schemas.student import StudentCreate, StudentResponse
from crud import (
    create_student,
    get_students,
    get_student_by_enrollment,
    save_embedding,
)
from services.face_service import face_service

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.get("", response_model=list[StudentResponse])
def list_students(db: Session = Depends(get_db)):
    return get_students(db)


@router.post("", response_model=StudentResponse)
def add_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    existing = get_student_by_enrollment(db, student_data.enrollmentNo)
    if existing:
        raise HTTPException(status_code=400, detail="Enrollment number already exists")
    return create_student(db, student_data)


@router.post("/{enrollmentNo}/images")
async def upload_student_image(
    enrollmentNo: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Upload training photo for a student by enrollment number.

    Request:
      - Path param: enrollmentNo
      - Body: multipart/form-data with `file` (jpeg/png)

    Requirements:
      - Exactly one face
      - Face clearly visible
      - Face size >= 100x100
    """
    # 1. Find student
    student = get_student_by_enrollment(db, enrollmentNo)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Read file bytes
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    # 3. Decode to OpenCV BGR image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise HTTPException(status_code=400, detail="Unsupported or corrupt image file")

    try:
        # 4. Generate embedding (this enforces face requirements)
        embedding = face_service.generate_embedding(img_bgr)

        # 5. Save embedding to DB
        save_embedding(db, student.id, embedding.tolist())
        student.photo_count += 1
        db.commit()

        return {
            "message": "Image uploaded successfully",
            "photo_count": student.photo_count,
        }

    except ValueError as ve:
        # Validation errors from generate_embedding
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
