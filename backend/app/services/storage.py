import boto3
from botocore.config import Config
from app.core.config import settings

class S3Storage:
    def __init__(self):
        self.s3_client = boto3.client(
            "s3",
            endpoint_url=f"http://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",  # MinIO defaults
        )
        self.bucket = settings.MINIO_BUCKET

    def upload_file(self, file_data: bytes, file_key: str, content_type: str) -> str:
        self.s3_client.put_object(
            Bucket=self.bucket,
            Key=file_key,
            Body=file_data,
            ContentType=content_type
        )
        return file_key

    def get_presigned_url(self, file_key: str, expires_in: int = 3600) -> str:
        url = self.s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": file_key},
            ExpiresIn=expires_in,
        )
        # Handle internal vs external endpoint for local development
        if settings.MINIO_ENDPOINT in url:
            url = url.replace(f"http://{settings.MINIO_ENDPOINT}", settings.MINIO_ENDPOINT_PUBLIC)
        return url

    def delete_file(self, file_key: str):
        self.s3_client.delete_object(Bucket=self.bucket, Key=file_key)

storage = S3Storage()
