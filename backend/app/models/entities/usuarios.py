from pydantic import BaseModel
from typing import Optional


class Usuario(BaseModel):
    username: str
    email: str
    nombre: str
    apellidos: str
    ubicacion: Optional[str] = None
