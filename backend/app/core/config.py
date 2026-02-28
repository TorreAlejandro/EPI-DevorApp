import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TFG Backend API"
    API_V1_STR: str = "/api/v1"
    
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/tfg_db")

    class Config:
        case_sensitive = True

settings = Settings()
