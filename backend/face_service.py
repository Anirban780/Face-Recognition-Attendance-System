# backend/face_service.py

import base64
from io import BytesIO
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

from insightface.app import FaceAnalysis

from .config import CROPS_DIR, MODELS_DIR


# ---------- Model setup (detector + recognizer in one) ----------

def _create_face_app():
    """
    Create a FaceAnalysis app that does both detection and recognition.
    Uses CPU (ctx_id = -1).
    """
    app = FaceAnalysis(
        name="buffalo_l",           # common bundled model (det + rec)
        root=str(MODELS_DIR),       # where to cache models (optional, but you have MODELS_DIR)
    )
    # det_size can be tuned; 640x640 is a good default
    app.prepare(ctx_id=-1, det_size=(640, 640))
    return app


face_app = _create_face_app()  # load once at import


# ---------- Helpers ----------

def _b64_to_cv2(img_b64: str):
    """Convert base64 image (with or without data: header) to OpenCV BGR array."""
    header, data = (img_b64.split(",", 1) if "," in img_b64 else (None, img_b64))
    b = base64.b64decode(data)
    img = Image.open(BytesIO(b)).convert("RGB")
    arr = np.array(img)[:, :, ::-1]  # RGB -> BGR for cv2
    return arr


# ---------- Detection & embedding ----------

def detect_and_crop(cv2_img):
    """
    Detect faces and return list of dicts:
    { 'bbox': (x1, y1, x2, y2), 'crop': crop_img, 'face': face_obj }
    """
    # face_app.get returns a list of Face objects
    faces = face_app.get(cv2_img)
    if not faces:
        return []

    h, w = cv2_img.shape[:2]
    crops = []

    for f in faces:
        x1, y1, x2, y2 = map(int, f.bbox)

        # clamp bbox to image bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w - 1, x2), min(h - 1, y2)

        crop = cv2_img[y1:y2, x1:x2].copy()
        crops.append({
            "bbox": (x1, y1, x2, y2),
            "crop": crop,
            "face": f,          # keep Face object so we can use its embedding
        })

    return crops


def get_embedding_from_b64(b64_str: str):
    """
    Takes a base64 image string, returns (embedding_list, bbox) for the largest face.
    If no face: (None, None).
    """
    img = _b64_to_cv2(b64_str)
    crops = detect_and_crop(img)
    if not crops:
        return None, None

    # choose largest face by area
    best = max(
        crops,
        key=lambda c: (c["bbox"][2] - c["bbox"][0]) * (c["bbox"][3] - c["bbox"][1]),
    )
    face = best["face"]

    # FaceAnalysis already provides L2-normalized embedding
    embedding = face.normed_embedding  # numpy array
    return embedding.tolist(), best["bbox"]


def save_probe_image_from_b64(b64_str: str, dest_path: Path):
    """
    Decode base64 image and save original image to dest_path.
    """
    img = _b64_to_cv2(b64_str)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(dest_path), img)
