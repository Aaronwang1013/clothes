import boto3
from botocore.config import Config
from sqlmodel import Session

from app.config import settings
from app.db import engine
from app.models import TryonTask
from app.providers import FashnProvider, KlingProvider, ReplicateProvider, SegmindProvider
from app.providers.base import TryonProvider
from app.storage import upload_image


def _get_provider() -> TryonProvider:
    provider = settings.tryon_provider
    if provider == "fashn":
        return FashnProvider()
    elif provider == "kling":
        return KlingProvider()
    elif provider == "segmind":
        return SegmindProvider()
    else:
        return ReplicateProvider()


def _download_from_minio(key: str) -> bytes:
    """Download image bytes from MinIO using internal Docker endpoint."""
    client = boto3.client(
        "s3",
        endpoint_url=f"http://{settings.minio_endpoint}",
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )
    resp = client.get_object(Bucket=settings.minio_bucket, Key=key)
    return resp["Body"].read()


def run_tryon(task_id: str, person_key: str, garment_key: str, category: str, garment_des: str = ""):
    """Run try-on inference via the configured provider. Called as a BackgroundTask."""
    with Session(engine) as session:
        task = session.get(TryonTask, task_id)
        if not task:
            return

        task.status = "processing"
        session.add(task)
        session.commit()

        try:
            person_bytes = _download_from_minio(person_key)
            garment_bytes = _download_from_minio(garment_key)

            provider = _get_provider()
            result = provider.run(person_bytes, garment_bytes, category, garment_des)

            result_key = upload_image(result.image_bytes, content_type="image/png")
            task.result_image_url = result_key
            task.status = "completed"

        except Exception as e:
            import traceback
            print("TRYON ERROR:", traceback.format_exc())
            task.status = "failed"
            task.error = str(e)[:500]

        session.add(task)
        session.commit()
