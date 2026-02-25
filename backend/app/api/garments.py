from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.db import get_session
from app.models import Garment
from app.storage import get_presigned_url

router = APIRouter(tags=["garments"])


@router.get("/garments")
def list_garments(session: Session = Depends(get_session)):
    garments = session.exec(select(Garment)).all()
    return [
        {
            "id": g.id,
            "name": g.name,
            "category": g.category,
            "image_url": get_presigned_url(g.image_url) if g.image_url else None,
        }
        for g in garments
    ]


@router.get("/garments/{garment_id}")
def get_garment(garment_id: str, session: Session = Depends(get_session)):
    garment = session.get(Garment, garment_id)
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found")
    return {
        "id": garment.id,
        "name": garment.name,
        "category": garment.category,
        "image_url": get_presigned_url(garment.image_url) if garment.image_url else None,
    }
