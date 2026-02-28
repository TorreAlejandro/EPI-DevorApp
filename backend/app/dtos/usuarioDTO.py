from pydantic import BaseModel
from typing import Optional

class UsuarioDTO(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    ubicacion: Optional[str] = None
