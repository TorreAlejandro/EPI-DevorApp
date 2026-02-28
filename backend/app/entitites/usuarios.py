from sqlalchemy import Column, String
from app.db.session import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    user_id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    nombre = Column(String, nullable=False)
    apellidos = Column(String, nullable=False)
    ubicacion = Column(String, nullable=True)
