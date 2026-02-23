from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Closet API"
    DEBUG: bool = False
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/closet"
    SECRET_KEY: str = "change-me-in-production"
    
    # MinIO / S3 Settings
    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ENDPOINT_PUBLIC: str = "http://localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "closet-items"
    MINIO_USE_SSL: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
