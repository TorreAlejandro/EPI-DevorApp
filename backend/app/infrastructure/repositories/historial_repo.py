"""
Repositorio para la tabla `historial` usando SQLAlchemy.
"""
from datetime import datetime, timezone
from typing import List

from sqlalchemy.orm import Session

from app.models.entities.historial import Historial


def get_historial_by_user(db: Session, user_id: str) -> List[Historial]:
    """
    Devuelve todas las entradas del historial de un usuario,
    ordenadas de más reciente a más antigua.
    """
    return (
        db.query(Historial)
        .filter(Historial.user_id == user_id)
        .order_by(Historial.fecha_acceso.desc())
        .all()
    )


def add_historial_entry(db: Session, user_id: str, place_id: str) -> Historial:
    """
    Inserta una nueva entrada en el historial con la fecha y hora actuales.
    Devuelve la entrada recién creada (con id y fecha asignados).
    """
    entry = Historial(
        user_id=user_id,
        place_id=place_id,
        fecha_acceso=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def delete_historial_entry(db: Session, entry_id: int, user_id: str) -> bool:
    """
    Elimina una entrada del historial por su ID si pertenece al usuario.
    Devuelve True si se eliminó, False si no existía o no pertenecía al usuario.
    """
    entry = db.query(Historial).filter(Historial.id == entry_id, Historial.user_id == user_id).first()
    if entry:
        db.delete(entry)
        db.commit()
        return True
    return False
