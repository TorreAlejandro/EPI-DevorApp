from pydantic import BaseModel

class LoginRequest(BaseModel):
    identifier: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    nombre: str
    apellidos: str
    ubicacion: str

class PasswordResetRequest(BaseModel):
    email: str
