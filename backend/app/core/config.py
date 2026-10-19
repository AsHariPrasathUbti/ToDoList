from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "TaskFlow API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    JWT_SECRET_KEY: str = "dev-secret-key-taskflow-super-secure-replace-in-production-2026-xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database (Default SQLite, easily swapped to PostgreSQL via DATABASE_URL)
    DATABASE_URL: str = "sqlite:///./todo.db"
    
    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    ADDITIONAL_ALLOWED_ORIGINS: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        origins = [self.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
        if self.ADDITIONAL_ALLOWED_ORIGINS:
            origins.extend([o.strip() for o in self.ADDITIONAL_ALLOWED_ORIGINS.split(",") if o.strip()])
        return list(set(origins))

settings = Settings()
