from sqlalchemy.orm import Session
from typing import List, Tuple

from models import FaceEmbedding, Student


def save_embedding(db: Session, student_id: int, embedding: list[float]):
    emb = FaceEmbedding(student_id=student_id, embedding=embedding)
    db.add(emb)
    db.commit()
    db.refresh(emb)
    return emb


def get_all_embeddings_for_training(db: Session) -> Tuple[list[list[float]], list[int]]:
    embeddings_list: List[list[float]] = []
    labels_list: List[int] = []

    students = db.query(Student).filter(Student.photo_count > 0).all()
    for student in students:
        for emb in student.embeddings:
            embeddings_list.append(emb.embedding)
            labels_list.append(student.id)

    return embeddings_list, labels_list
