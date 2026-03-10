from fastapi import APIRouter, Response, status, Depends
from app.models.dtos.auth_dto import LoginRequest, RegisterRequest
from app.services import auth_service
from app.core.config import settings
from app.core.security import get_current_user
from app.models.entities.usuarios import Usuario

router = APIRouter(prefix="/api", tags=["Auth"])

@router.post("/login")
def login(login_data: LoginRequest, response: Response):
    user, access_token = auth_service.login(login_data.identifier, login_data.password)

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        secure=False,
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

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest):
    user = auth_service.register(data)
    return {
        "message": "Cuenta creada correctamente",
        "user": {
            "username": user.username,
            "email": user.email,
            "nombre": user.nombre,
            "apellidos": user.apellidos,
        },
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Sesión cerrada"}

@router.get("/me")
def get_me(current_user: Usuario = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "nombre": current_user.nombre,
        "apellidos": current_user.apellidos,
    }
