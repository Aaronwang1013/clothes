from fastapi import APIRouter, BackgroundTasks, Depends, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlmodel import Session

from app.db import get_session
from app.inference import run_tryon
from app.models import Garment, TryonTask
from app.storage import get_presigned_url, upload_image

router = APIRouter(tags=["tryon"])


class TryonRequest(BaseModel):
    garment_id: str


@router.post("/tryon")
async def create_tryon(
    person_image: UploadFile,
    garment_id: str = Form(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    session: Session = Depends(get_session),
):
    # Validate garment exists
    garment = session.get(Garment, garment_id)
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")

    # Upload person image to MinIO
    person_bytes = await person_image.read()
    person_key = upload_image(person_bytes, content_type=person_image.content_type or "image/png")

    # Create task
    task = TryonTask(person_image_url=person_key, garment_id=garment_id)
    session.add(task)
    session.commit()
    session.refresh(task)

    # Run inference in background
    background_tasks.add_task(run_tryon, task.id, person_key, garment.image_url, garment.category, garment.name)

    return {"task_id": task.id, "status": task.status}


@router.get("/tryon/{task_id}")
def get_tryon_status(task_id: str, session: Session = Depends(get_session)):
    task = session.get(TryonTask, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    result = {
        "task_id": task.id,
        "status": task.status,
        "created_at": task.created_at.isoformat(),
    }

    if task.status == "completed" and task.result_image_url:
        result["result_image_url"] = get_presigned_url(task.result_image_url)
        result["person_image_url"] = get_presigned_url(task.person_image_url)

    if task.status == "failed":
        result["error"] = task.error

    return result
