# routers/recognition.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import numpy as np
import cv2

from database import get_db
from schemas.recognition import RecognitionResponse, TrainModelResponse
from crud import (
    get_student_by_id,
    get_active_sessions,
    create_attendance_record,
    check_existing_attendance,
    get_all_embeddings_for_training,
)
from services.face_service import face_service

router = APIRouter(prefix="/api", tags=["Recognition"])


@router.post("/train", response_model=TrainModelResponse)
def train_face_model(db: Session = Depends(get_db)):
    embeddings_list, labels_list = get_all_embeddings_for_training(db)
    if not embeddings_list:
        raise HTTPException(
            status_code=400, detail="No students with training data found"
        )

    face_service.train_classifier(embeddings_list, labels_list)
    return TrainModelResponse(
        message="Model trained successfully", faces_encoded=len(embeddings_list)
    )


@router.post("/recognize", response_model=RecognitionResponse)
async def recognize_face(
    file: UploadFile = File(...),
    window_id: str | None = Form(None),
    db: Session = Depends(get_db),
):
    """
    Recognize a face and mark attendance.

    Request (multipart/form-data):
      - file: image (jpeg/png) from computer or camera
      - window_id: optional string (e.g., kiosk/session id)
    """
    # 1. Read file
    image_bytes = await file.read()
    if not image_bytes:
        return RecognitionResponse(success=False, message="Empty image file")

    # 2. Decode to OpenCV image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return RecognitionResponse(success=False, message="Invalid or unsupported image")

    # 3. Generate embedding with validations
    try:
        embedding = face_service.generate_embedding(img_bgr)
    except ValueError as ve:
        return RecognitionResponse(success=False, message=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recognition failed: {str(e)}")

    # 4. Predict student
    student_id = face_service.recognize_face(embedding)
    if student_id is None:
        return RecognitionResponse(success=False, message="Face not recognized")

    student = get_student_by_id(db, student_id)
    if not student:
        return RecognitionResponse(success=False, message="Student not found in database")

    # 5. Get active session
    active_sessions = get_active_sessions(db)
    if not active_sessions:
        return RecognitionResponse(success=False, message="No active session found")
    session = active_sessions[0]

    # 6. Avoid duplicate attendance
    if check_existing_attendance(db, student.id, session.id):
        return RecognitionResponse(
            success=False, message="Attendance already marked for this session"
        )

    # 7. Mark attendance
    create_attendance_record(db, student.id, session.id)

    return RecognitionResponse(
        success=True,
        student=f"{student.name} ({student.enrollment_no})",
        enrollmentNo=student.enrollment_no,
    )
