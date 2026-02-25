import httpx
import replicate
from sqlmodel import Session

from app.config import settings
from app.db import engine
from app.models import TryonTask
from app.storage import get_presigned_url, upload_image


def run_tryon(task_id: str, person_key: str, garment_key: str, category: str):
    """Run IDM-VTON inference via Replicate API. Called as a BackgroundTask."""
    with Session(engine) as session:
        task = session.get(TryonTask, task_id)
        if not task:
            return

        task.status = "processing"
        session.add(task)
        session.commit()

        try:
            # Generate presigned URLs for Replicate to access images
            person_url = get_presigned_url(person_key)
            garment_url = get_presigned_url(garment_key)

            # Call Replicate IDM-VTON
            output = replicate.run(
                "cuuupid/idm-vton:c871bb9b046c1b1f6e63e7a4cebe1554a14d32bf39447819ac1dfa920bbedf30",
                input={
                    "human_img": person_url,
                    "garm_img": garment_url,
                    "category": category,
                },
            )

            # output is a URL to the generated image
            result_url = str(output)

            # Download the result image
            resp = httpx.get(result_url, timeout=60)
            resp.raise_for_status()

            # Upload to MinIO
            result_key = upload_image(resp.content, content_type="image/png")

            task.result_image_url = result_key
            task.status = "completed"

        except Exception as e:
            task.status = "failed"
            task.error = str(e)[:500]

        session.add(task)
        session.commit()
