from fastapi import APIRouter, UploadFile

from app.storage import get_presigned_url, upload_image

router = APIRouter(tags=["upload"])


@router.post("/upload")
async def upload(file: UploadFile):
    contents = await file.read()
    key = upload_image(contents, content_type=file.content_type or "image/png")
    return {"key": key, "url": get_presigned_url(key)}
