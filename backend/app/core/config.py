from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Closet API"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/closet"
    SECRET_KEY: str = "change-me-in-production"

    class Config:
        env_file = ".env"


settings = Settings()
