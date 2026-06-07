import uuid

import boto3
from botocore.config import Config

from app.config import settings


def _get_client(for_presign: bool = False):
    """Return a boto3 S3 client.

    - use_s3=True  → 真實 AWS S3（生產）
    - use_s3=False → MinIO（本地開發），for_presign 時改用 public endpoint
    """
    if settings.use_s3:
        return boto3.client(
            "s3",
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
            region_name=settings.s3_region,
            config=Config(signature_version="s3v4"),
        )
    else:
        endpoint = settings.minio_public_endpoint if for_presign else settings.minio_endpoint
        scheme = "https" if settings.minio_use_ssl else "http"
        return boto3.client(
            "s3",
            endpoint_url=f"{scheme}://{endpoint}",
            aws_access_key_id=settings.minio_access_key,
            aws_secret_access_key=settings.minio_secret_key,
            config=Config(signature_version="s3v4"),
            region_name="us-east-1",
        )


def _bucket() -> str:
    return settings.aws_s3_bucket if settings.use_s3 else settings.minio_bucket


def ensure_bucket():
    """建立 bucket（MinIO 開發用；S3 生產環境請事先在 Console 建立）。"""
    if settings.use_s3:
        return  # S3 bucket 在 AWS Console 手動建立
    client = _get_client()
    try:
        client.head_bucket(Bucket=_bucket())
    except Exception:
        client.create_bucket(Bucket=_bucket())


def upload_image(file_bytes: bytes, content_type: str = "image/png") -> str:
    """Upload image bytes to storage and return the object key."""
    client = _get_client()
    ensure_bucket()
    key = f"images/{uuid.uuid4().hex}.png"
    client.put_object(
        Bucket=_bucket(),
        Key=key,
        Body=file_bytes,
        ContentType=content_type,
    )
    return key


def get_presigned_url(key: str, expires: int = 3600) -> str:
    """Generate a presigned URL for browser access."""
    client = _get_client(for_presign=True)
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": _bucket(), "Key": key},
        ExpiresIn=expires,
    )
