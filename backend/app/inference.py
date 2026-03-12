import io

import boto3
import httpx
import replicate
from botocore.config import Config
from sqlmodel import Session

from app.config import settings
from app.db import engine
from app.models import TryonTask
from app.storage import upload_image


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
    """Run IDM-VTON inference via Replicate API. Called as a BackgroundTask."""
    with Session(engine) as session:
        task = session.get(TryonTask, task_id)
        if not task:
            return

        task.status = "processing"
        session.add(task)
        session.commit()

        try:
            # Download images from MinIO (internal Docker network)
            person_bytes = _download_from_minio(person_key)
            garment_bytes = _download_from_minio(garment_key)

            # BytesIO needs a .name attribute for Replicate SDK multipart upload
            person_file = io.BytesIO(person_bytes)
            person_file.name = "person.jpg"
            garment_file = io.BytesIO(garment_bytes)
            garment_file.name = "garment.jpg"

            # Call Replicate IDM-VTON (latest version)
            output = replicate.run(
                "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
                input={
                    "human_img": person_file,
                    "garm_img": garment_file,
                    "category": category,
                    "garment_des": garment_des,
                },
            )

            # output may be a FileOutput object, a list, or a URL string
            if isinstance(output, list):
                result_url = str(output[0])
            else:
                result_url = str(output)

            # Download the result image
            resp = httpx.get(result_url, timeout=60)
            resp.raise_for_status()

            # Upload to MinIO
            result_key = upload_image(resp.content, content_type="image/png")

            task.result_image_url = result_key
            task.status = "completed"

        except Exception as e:
            import traceback
            print("TRYON ERROR:", traceback.format_exc())
            task.status = "failed"
            task.error = str(e)[:500]

        session.add(task)
        session.commit()
