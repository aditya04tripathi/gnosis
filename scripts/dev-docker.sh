#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.dev.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  if [[ -f .env.local.example ]]; then
    cp .env.local.example .env.local
    echo "Created .env.local — set GROQ_API_KEY, then re-run: pnpm dev:docker"
    exit 1
  fi
  echo "Create .env.local from .env.local.example"
  exit 1
fi

echo "Starting MongoDB + Next.js dev server in Docker (hot reload via volumes)..."
docker compose --env-file .env.local -f "$COMPOSE_FILE" --profile docker-dev up --build
