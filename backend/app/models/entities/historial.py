"""
Modelo ORM SQLAlchemy para la tabla `historial`.

Campos:
  - id           : clave primaria autoincremental
  - user_id      : Firebase UID del usuario
  - place_id     : ID de Google Places del restaurante
  - fecha_acceso : timestamp con timezone del momento en que se guardó
"""
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.infrastructure.database import Base


class Historial(Base):
    __tablename__ = "historial"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False, index=True)
    place_id = Column(String, nullable=False)
    fecha_acceso = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return (
            f"<Historial id={self.id} user_id={self.user_id!r} "
            f"place_id={self.place_id!r} fecha_acceso={self.fecha_acceso}>"
        )
