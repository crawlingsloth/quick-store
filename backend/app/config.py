from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # Admin User Configuration (for seed_admin.py)
    ADMIN_USERNAME: Optional[str] = "admin"
    ADMIN_EMAIL: Optional[str] = "admin@quick-store.com"
    ADMIN_PASSWORD: Optional[str] = None

    # Company Configuration (for seed_admin.py)
    COMPANY_NAME: Optional[str] = "QuickStore"
    COMPANY_CURRENCY: Optional[str] = "$"
    COMPANY_MAX_STORES: Optional[int] = 10

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
