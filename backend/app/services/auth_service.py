import re
from datetime import timedelta
from fastapi import HTTPException, status
from app.core.config import settings
from app.core.security import create_access_token
from app.models.entities.usuarios import Usuario
from app.infrastructure.repositories.usuario_repo import (
    verify_password_and_get_uid,
    get_usuario_by_uid,
    get_uid_by_username,
    create_usuario,
)
from app.models.dtos.auth_dto import RegisterRequest

_EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_PASSWORD_REGEX = re.compile(r"^(?=.*[A-Za-z])(?=.*\d).{8,}$")

def login(identifier: str, password: str) -> tuple[Usuario, str]:
    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faltan credenciales",
        )

    is_email = bool(_EMAIL_REGEX.match(identifier))

    if is_email:
        email = identifier
    else:
        uid = get_uid_by_username(identifier)
        if uid is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )
        from firebase_admin import auth as fb_auth
        try:
            user_record = fb_auth.get_user(uid)
            email = user_record.email
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )

    uid = verify_password_and_get_uid(email, password)
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
        data={"sub": uid},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return user, access_token


def register(data: RegisterRequest) -> Usuario:
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
    return user
