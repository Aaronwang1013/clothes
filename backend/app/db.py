from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

engine = create_engine(settings.database_url, echo=False)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


# SQLite 不支援自動欄位遷移，啟動時手動補齊新欄位
_USER_NEW_COLUMNS = [
    ("height_cm", "FLOAT"),
    ("weight_kg", "FLOAT"),
    ("bust_cm", "FLOAT"),
    ("waist_cm", "FLOAT"),
    ("hips_cm", "FLOAT"),
]


def run_migrations():
    with engine.connect() as conn:
        existing = {row[1] for row in conn.execute(text("PRAGMA table_info(user)"))}
        for col_name, col_type in _USER_NEW_COLUMNS:
            if col_name not in existing:
                conn.execute(text(f"ALTER TABLE user ADD COLUMN {col_name} {col_type}"))
        conn.commit()


def get_session():
    with Session(engine) as session:
        yield session
