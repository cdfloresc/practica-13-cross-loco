# ====================================================
# UNIFIED DOCKERFILE (Frontend React + Backend FastAPI)
# ====================================================
# Etapa 1: Build del Frontend React (Vite)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web/ ./
RUN npm run build

# Etapa 2: Servidor Unificado Python FastAPI
FROM python:3.10-slim
WORKDIR /app

ENV PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY web/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY modelo/ /app/modelo/
COPY web/api.py /app/api.py
COPY --from=frontend-builder /app/web/dist /app/static

EXPOSE 8000

CMD ["sh", "-c", "uvicorn api:app --host 0.0.0.0 --port ${PORT:-8000}"]
