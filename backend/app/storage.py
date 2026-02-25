import uuid

import boto3
from botocore.config import Config

from app.config import settings


def _get_client(endpoint: str | None = None):
    return boto3.client(
        "s3",
        endpoint_url=f"http{'s' if settings.minio_use_ssl else ''}://{endpoint or settings.minio_endpoint}",
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket():
    client = _get_client()
    try:
        client.head_bucket(Bucket=settings.minio_bucket)
    except Exception:
        client.create_bucket(Bucket=settings.minio_bucket)


def upload_image(file_bytes: bytes, content_type: str = "image/png") -> str:
    """Upload image bytes to MinIO and return the object key."""
    client = _get_client()
    ensure_bucket()
    key = f"images/{uuid.uuid4().hex}.png"
    client.put_object(
        Bucket=settings.minio_bucket,
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return key


def get_presigned_url(key: str, expires: int = 3600) -> str:
    """Generate a presigned URL for accessing an object (uses public endpoint for browser access)."""
    client = _get_client(endpoint=settings.minio_public_endpoint)
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.minio_bucket, "Key": key},
        ExpiresIn=expires,
    )
