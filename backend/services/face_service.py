# services/face_service.py
import insightface
import numpy as np
from sklearn.svm import SVC
import joblib
from typing import List, Optional


class FaceRecognitionService:
    def __init__(self):
        self.app = None
        self.classifier: Optional[SVC] = None

    def load_model(self):
        """Load InsightFace model and, if present, a trained classifier."""
        self.app = insightface.app.FaceAnalysis()
        self.app.prepare(ctx_id=0, det_size=(640, 640))
        try:
            self.classifier = joblib.load("trained_model.pkl")
        except Exception:
            self.classifier = None

    def generate_embedding(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Generate a face embedding from an OpenCV BGR image.

        Requirements:
        - Exactly one face in the image
        - Face size >= 100x100 pixels
        """
        faces = self.app.get(img_bgr)

        if not faces:
            raise ValueError("No face detected in image")

        if len(faces) > 1:
            raise ValueError("Multiple faces detected; please upload a photo with only one face")

        face = faces[0]
        x1, y1, x2, y2 = face.bbox.astype(int)
        w = x2 - x1
        h = y2 - y1

        if w < 100 or h < 100:
            raise ValueError("Face too small; ensure face is at least 100x100 pixels and clearly visible")

        return face.embedding

    def train_classifier(self, embeddings: List[List[float]], labels: List[int]):
        if not embeddings:
            raise ValueError("No embeddings provided for training")
        self.classifier = SVC(probability=True)
        self.classifier.fit(embeddings, labels)
        joblib.dump(self.classifier, "trained_model.pkl")

    def recognize_face(self, embedding: np.ndarray) -> Optional[int]:
        if not self.classifier:
            return None
        pred = self.classifier.predict([embedding])[0]
        return int(pred)


face_service = FaceRecognitionService()
