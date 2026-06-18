import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Prabhav AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./prabhav_ai.db"
    
    # Auth Settings
    JWT_SECRET: str = "prabhav_ai_super_secret_key_change_me_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # APIs
    GEMINI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
