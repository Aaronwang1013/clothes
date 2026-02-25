FROM python:3.11-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy project definition and install dependencies
COPY pyproject.toml .
RUN mkdir -p app && touch app/__init__.py && \
    uv pip install --system --no-cache .

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
