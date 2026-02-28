from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.db.session import get_db
from app.entitites.usuarios import Usuario
from app.dtos.usuarioDTO import UsuarioDTO

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Esto es necesario para que el frontend (React) pueda hacer peticiones al backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API del TFG"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/login")
def login(login_data: UsuarioDTO, db: Session = Depends(get_db)):
    if not login_data.password or (not login_data.email and not login_data.user_id):
        raise HTTPException(status_code=400, detail="Faltan credenciales")
        
    user = db.query(Usuario).filter(
        or_(
            Usuario.email == login_data.email if login_data.email else False,
            Usuario.user_id == login_data.user_id if login_data.user_id else False
        )
    ).first()
    
    if not user or user.password != login_data.password:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
        
    return {
        "message": "Login exitoso", 
        "user": {
            "user_id": user.user_id,
            "email": user.email, 
            "nombre": user.nombre,
            "apellidos": user.apellidos
        }
    }
