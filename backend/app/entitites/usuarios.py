from pydantic import BaseModel
from typing import Optional


class Usuario(BaseModel):
    """Modelo de usuario en memoria (sin ORM — los datos viven en Firebase)."""
    username: str      # nombre de usuario (guardado en Firestore)
    email: str
    nombre: str
    apellidos: str
    ubicacion: Optional[str] = None
