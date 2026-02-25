import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Garment(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    name: str
    category: str = "upper_body"
    image_url: str


class TryonTask(SQLModel, table=True):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex, primary_key=True)
    person_image_url: str
    garment_id: str = Field(foreign_key="garment.id")
    status: str = "pending"  # pending | processing | completed | failed
    result_image_url: str | None = None
    error: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
