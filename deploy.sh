#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Gnosis VPS Deployment Script
# Manages /root/ports.csv port assignment, pulls pre-built image, and deploys
# ==============================================================================

APP_NAME="gnosis"
PORTS_FILE="/root/ports.csv"
START_PORT=3000
COMPOSE_FILE="docker-compose.yml"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "=================================================="
echo "🚀 Deploying ${APP_NAME} (${IMAGE_TAG})"
echo "=================================================="

# Ensure script is executed as root (required for /root/ports.csv)
if [ "$(id -u)" -ne 0 ]; then
    echo "❌ Error: This script must be run as root (or with sudo) to access ${PORTS_FILE}." >&2
    exit 1
fi

# Ensure Docker and Docker Compose are installed
if ! command -v docker >/dev/null 2>&1; then
    echo "❌ Error: Docker is not installed. Install Docker first." >&2
    exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
    echo "❌ Error: Docker Compose (v2) plugin is not available." >&2
    exit 1
fi

# ------------------------------------------------------------------------------
# 1. Resolve or allocate port in /root/ports.csv
# ------------------------------------------------------------------------------
mkdir -p "$(dirname "${PORTS_FILE}")"

if [ ! -f "${PORTS_FILE}" ]; then
    echo "Creating ${PORTS_FILE}..."
    touch "${PORTS_FILE}"
fi

ASSIGNED_PORT=""

# Check if application already exists in ports.csv
if grep -E "^${APP_NAME}," "${PORTS_FILE}" >/dev/null 2>&1; then
    ASSIGNED_PORT=$(grep -E "^${APP_NAME}," "${PORTS_FILE}" | tail -n 1 | cut -d',' -f2 | tr -d '[:space:]')
    echo "ℹ️  Found existing port mapping for '${APP_NAME}': Port ${ASSIGNED_PORT}"
else
    echo "🔍 Allocating next available port starting from ${START_PORT}..."
    CANDIDATE_PORT=${START_PORT}

    while true; do
        # 1. Check if candidate port is in /root/ports.csv
        PORT_IN_CSV=$(grep -E ",${CANDIDATE_PORT}$" "${PORTS_FILE}" || true)
        
        # 2. Check if candidate port is currently listening in the OS
        PORT_IN_USE=""
        if command -v ss >/dev/null 2>&1; then
            PORT_IN_USE=$(ss -tulpn 2>/dev/null | grep -E ":${CANDIDATE_PORT}\b" || true)
        elif command -v netstat >/dev/null 2>&1; then
            PORT_IN_USE=$(netstat -tulpn 2>/dev/null | grep -E ":${CANDIDATE_PORT}\b" || true)
        elif command -v lsof >/dev/null 2>&1; then
            PORT_IN_USE=$(lsof -i ":${CANDIDATE_PORT}" || true)
        fi

        if [ -z "${PORT_IN_CSV}" ] && [ -z "${PORT_IN_USE}" ]; then
            ASSIGNED_PORT=${CANDIDATE_PORT}
            break
        fi

        CANDIDATE_PORT=$((CANDIDATE_PORT + 1))
    done

    # Append to /root/ports.csv in appname,port format
    echo "${APP_NAME},${ASSIGNED_PORT}" >> "${PORTS_FILE}"
    echo "✅ Assigned port ${ASSIGNED_PORT} and recorded to ${PORTS_FILE}"
fi

# ------------------------------------------------------------------------------
# 2. Configure .env file
# ------------------------------------------------------------------------------
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚠️  No .env found. Creating .env from .env.example..."
        cp .env.example .env
    else
        echo "Creating blank .env file..."
        touch .env
    fi
fi

# Update or insert APP_PORT in .env
if grep -q "^APP_PORT=" .env; then
    sed -i "s/^APP_PORT=.*/APP_PORT=${ASSIGNED_PORT}/" .env
else
    echo "APP_PORT=${ASSIGNED_PORT}" >> .env
fi

# Ensure MONGODB_URI points to internal mongo container if not set
if ! grep -q "^MONGODB_URI=" .env || [ -z "$(grep "^MONGODB_URI=" .env | cut -d'=' -f2-)" ]; then
    if grep -q "^MONGODB_URI=" .env; then
        sed -i "s|^MONGODB_URI=.*|MONGODB_URI=mongodb://mongo:27017/gnosis|" .env
    else
        echo "MONGODB_URI=mongodb://mongo:27017/gnosis" >> .env
    fi
fi

export APP_PORT="${ASSIGNED_PORT}"
export IMAGE_TAG="${IMAGE_TAG}"

# ------------------------------------------------------------------------------
# 3. Pull and deploy pre-built container
# ------------------------------------------------------------------------------
echo "📦 Pulling latest pre-built container image..."
docker compose -f "${COMPOSE_FILE}" pull app || {
    echo "⚠️  Note: If GHCR image is private, run: echo \$GHCR_TOKEN | docker login ghcr.io -u <username> --password-stdin"
}

echo "🚢 Launching services..."
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans

# ------------------------------------------------------------------------------
# 4. Storage cleanup (Crucial for constrained root partitions e.g. 15GB)
# ------------------------------------------------------------------------------
echo "🧹 Pruning unused dangling images to preserve disk space..."
docker image prune -f >/dev/null 2>&1 || true

# ------------------------------------------------------------------------------
# 5. Service verification
# ------------------------------------------------------------------------------
echo "⏳ Verifying service health on http://127.0.0.1:${ASSIGNED_PORT}..."
HEALTHY=false
for i in {1..15}; do
    if curl -s -f "http://127.0.0.1:${ASSIGNED_PORT}/api/health" >/dev/null 2>&1 || \
       curl -s -f "http://127.0.0.1:${ASSIGNED_PORT}/" >/dev/null 2>&1; then
        HEALTHY=true
        break
    fi
    sleep 2
done

echo ""
echo "=================================================="
if [ "$HEALTHY" = true ]; then
    echo "✅ ${APP_NAME} successfully deployed!"
else
    echo "⚠️  ${APP_NAME} is running, but healthcheck took longer than expected to respond."
    echo "   Check container logs using: docker compose logs -f app"
fi
echo "📍 Machine Port: http://127.0.0.1:${ASSIGNED_PORT}"
echo "📄 Port Registry: ${PORTS_FILE} contains '${APP_NAME},${ASSIGNED_PORT}'"
echo ""
echo "☁️  Direct Cloudflare Tunnel configuration (/etc/cloudflared/config.yml):"
echo "   - hostname: gnosis.adityatripathi.dev"
echo "     service: http://127.0.0.1:${ASSIGNED_PORT}"
echo "=================================================="
docker compose ps
