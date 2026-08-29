#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE=".env.local"
EXAMPLE_FILE=".env.local.example"

if [[ ! -f "$ENV_FILE" ]]; then
  if [[ -f "$EXAMPLE_FILE" ]]; then
    cp "$EXAMPLE_FILE" "$ENV_FILE"
    echo "Created $ENV_FILE from $EXAMPLE_FILE"
  else
    echo "Missing $ENV_FILE — create it first."
    exit 1
  fi
fi

WEBHOOK_SECRET="$(openssl rand -hex 32)"
APP_NAME="Gnosis Local"
APP_URL="http://localhost:3000"
CALLBACK_URL="${APP_URL}/api/github/callback"
WEBHOOK_URL="${APP_URL}/api/github/webhook"

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    if [[ "$(uname)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    else
      sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
    fi
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

set_env "GITHUB_WEBHOOK_SECRET" "$WEBHOOK_SECRET"

echo ""
echo "GitHub local setup"
echo "=================="
echo ""
echo "1. Create a GitHub OAuth App (browser will open):"
echo "   Name:          $APP_NAME"
echo "   Homepage URL:  $APP_URL"
echo "   Callback URL:  $CALLBACK_URL"
echo ""
echo "2. After creating the app, copy Client ID + Client Secret into $ENV_FILE:"
echo "   GITHUB_CLIENT_ID=..."
echo "   GITHUB_CLIENT_SECRET=..."
echo ""
echo "3. Webhook secret (already written to $ENV_FILE):"
echo "   GITHUB_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo ""
echo "4. On each linked repo, add a webhook:"
echo "   Payload URL: $WEBHOOK_URL"
echo "   Content type: application/json"
echo "   Secret: (same as GITHUB_WEBHOOK_SECRET)"
echo "   Events: Issues"
echo ""
echo "5. Restart dev server: pnpm dev:local"
echo ""

if command -v open >/dev/null 2>&1; then
  open "https://github.com/settings/applications/new"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "https://github.com/settings/applications/new"
else
  echo "Open: https://github.com/settings/applications/new"
fi
