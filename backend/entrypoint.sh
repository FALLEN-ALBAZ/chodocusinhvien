#!/bin/sh
set -e

echo "============================================================"
echo "[Entrypoint] 1/3: Running Alembic database migrations..."
echo "============================================================"
alembic upgrade head

echo "============================================================"
echo "[Entrypoint] 2/3: Seeding initial database data..."
echo "============================================================"
python -m app.seed

echo "============================================================"
echo "[Entrypoint] 3/3: Starting FastAPI Uvicorn server on 0.0.0.0:8000..."
echo "============================================================"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
