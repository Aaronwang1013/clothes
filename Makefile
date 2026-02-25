.PHONY: dev down build logs seed clean

dev:
	docker compose up --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

seed:
	docker compose exec backend python -c "from app.seed import seed_garments; seed_garments()"

clean:
	docker compose down -v
	rm -f backend/tryon.db
