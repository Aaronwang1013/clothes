import io
import os

from PIL import Image
from sqlmodel import Session, select

from app.db import engine
from app.models import Garment
from app.storage import upload_image

SAMPLE_GARMENTS = [
    {"name": "White T-Shirt", "category": "upper_body"},
    {"name": "Black T-Shirt", "category": "upper_body"},
    {"name": "Blue Denim Shirt", "category": "upper_body"},
    {"name": "Red Polo Shirt", "category": "upper_body"},
    {"name": "Grey Hoodie", "category": "upper_body"},
    {"name": "Navy Blazer", "category": "upper_body"},
    {"name": "Striped Shirt", "category": "upper_body"},
    {"name": "Green Sweater", "category": "upper_body"},
    {"name": "White Button-Down", "category": "upper_body"},
    {"name": "Black Jacket", "category": "upper_body"},
]

# Map garment names to placeholder colors
_COLORS = [
    (255, 255, 255),  # white
    (30, 30, 30),  # black
    (70, 130, 180),  # blue
    (200, 50, 50),  # red
    (150, 150, 150),  # grey
    (0, 0, 128),  # navy
    (100, 100, 200),  # striped (placeholder)
    (34, 139, 34),  # green
    (245, 245, 245),  # white
    (20, 20, 20),  # black
]


def _create_placeholder_image(color: tuple[int, int, int]) -> bytes:
    """Create a simple 512x512 placeholder garment image."""
    img = Image.new("RGB", (512, 512), color)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def seed_garments():
    """Seed default garments into DB if empty. Uses placeholder images."""
    with Session(engine) as session:
        existing = session.exec(select(Garment)).first()
        if existing:
            return  # Already seeded

        # Check for sample garment images in scripts/sample_garments/
        sample_dir = os.path.join(os.path.dirname(__file__), "..", "scripts", "sample_garments")

        for i, garment_data in enumerate(SAMPLE_GARMENTS):
            # Try to use real image if available, otherwise generate placeholder
            image_path = os.path.join(sample_dir, f"{i + 1:02d}.png")
            if os.path.exists(image_path):
                with open(image_path, "rb") as f:
                    image_bytes = f.read()
            else:
                image_bytes = _create_placeholder_image(_COLORS[i])

            key = upload_image(image_bytes)

            garment = Garment(
                name=garment_data["name"],
                category=garment_data["category"],
                image_url=key,
            )
            session.add(garment)

        session.commit()
