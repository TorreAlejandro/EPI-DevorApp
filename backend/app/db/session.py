from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# engine es el punto de entrada a la base de datos
engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI, 
)

# SessionLocal será usado para crear sesiones de base de datos interactivas
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base es la clase de la que heredarán nuestros modelos ORM
Base = declarative_base()

# Dependencia para obtener la sesión de base de datos en los endpoints (FastAPI Depends)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
