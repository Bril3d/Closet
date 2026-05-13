from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Closet API"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/closet"
    SECRET_KEY: str = "change-me-in-production"
    
    # Database Settings (from .env)
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "closet"
    
    # MinIO / S3 Settings
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ENDPOINT_PUBLIC: str = "http://localhost:9000" # Set this to your IP in .env for mobile testing
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "closet-items"
    MINIO_USE_SSL: bool = False

    # Weather API
    OPENWEATHER_API_KEY: str = "1fdb94a6971f00db73a8ae162c89f4f7"

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()
