#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.dev.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop and try again."
  exit 1
fi

if [[ ! -f .env.local ]]; then
  if [[ -f .env.local.example ]]; then
    echo "No .env.local found — copying from .env.local.example"
    cp .env.local.example .env.local
    echo "Edit .env.local (pull an Ollama model with: ollama pull llama3.2:1b) then re-run: pnpm dev:local"
    exit 1
  fi
  echo "Create .env.local from .env.local.example before running dev:local"
  exit 1
fi

echo "Starting MongoDB (Docker)..."
docker compose --env-file .env.local -f "$COMPOSE_FILE" up mongo -d --wait

echo ""
echo "MongoDB ready at mongodb://127.0.0.1:27017"
echo "Starting Next.js with hot reload at http://localhost:3000"
echo ""

exec pnpm exec next dev -p 3000
