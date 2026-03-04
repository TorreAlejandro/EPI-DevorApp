import re
from datetime import timedelta

from fastapi import FastAPI, Depends, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import create_access_token, get_current_user
from app.entitites.usuarios import Usuario
from app.firebase.usuario_repo import (
    verify_password_and_get_uid,
    get_usuario_by_uid,
    get_uid_by_username,
    create_usuario,
)

_EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
# Contraseña: mínimo 8 caracteres, al menos una letra y un número
_PASSWORD_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Necesario para que el frontend (React) pueda hacer peticiones al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    identifier: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    username: str
    nombre: str
    apellidos: str
    ubicacion: str | None = None

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del TFG"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/login")
def login(login_data: LoginRequest, response: Response):
    """
    Autentica al usuario contra Firebase Authentication y devuelve
    el JWT propio en una cookie HTTP-only.
    Acepta email o user_id (uid de Firebase) como identificador.
    """
    if not login_data.identifier or not login_data.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan credenciales",
        )

    is_email = bool(_EMAIL_REGEX.match(login_data.identifier))

    if is_email:
        email = login_data.identifier
    else:
        # El identificador es un username — buscamos su uid en Firestore
        uid = get_uid_by_username(login_data.identifier)
        if uid is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )
        # Ahora obtenemos el email asociado al uid para verificar la contraseña
        from firebase_admin import auth as fb_auth
        try:
            user_record = fb_auth.get_user(uid)
            email = user_record.email
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )

    # Verificación de contraseña contra Firebase REST API
    uid = verify_password_and_get_uid(email, login_data.password)
    if uid is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    user = get_usuario_by_uid(uid)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado en la base de datos",
        )

    access_token = create_access_token(
        data={"sub": uid},   # uid = Firebase UID, usado internamente en el JWT
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    # El token va en una cookie HTTP-only
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",   # protección CSRF básica
        secure=False,     # cambiar a True en producción (HTTPS)
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return {
        "message": "Login exitoso",
        "user": {
            "username": user.username,
            "email": user.email,
            "nombre": user.nombre,
            "apellidos": user.apellidos,
        },
    }


@app.post("/api/logout")
def logout(response: Response):
    """Elimina la cookie de sesión."""
    response.delete_cookie(key="access_token")
    return {"message": "Sesión cerrada"}


@app.get("/api/me")
def get_me(current_user: Usuario = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "nombre": current_user.nombre,
        "apellidos": current_user.apellidos,
    }


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):
    """
    Crea un nuevo usuario en Firebase Authentication y guarda su perfil en Firestore.
    """
    if not _EMAIL_REGEX.match(data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email no tiene un formato válido",
        )
    if not _PASSWORD_REGEX.match(data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres, una letra y un número",
        )
    if not (3 <= len(data.username) <= 30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El username debe tener entre 3 y 30 caracteres",
        )

    user = create_usuario(
        email=data.email,
        password=data.password,
        username=data.username,
        nombre=data.nombre,
        apellidos=data.apellidos,
        ubicacion=data.ubicacion,
    )

    return {
        "message": "Cuenta creada correctamente",
        "user": {
            "username": user.username,
            "email": user.email,
            "nombre": user.nombre,
            "apellidos": user.apellidos,
        },
    }
