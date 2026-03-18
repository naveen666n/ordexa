#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# app-deploy.sh  —  Deploy / redeploy the application on EC2
# Run after server is set up (deploy.sh already completed)
# Usage:  ./app-deploy.sh
#
# Expects project source in current working directory:
#   ./backend/    — Node.js backend
#   ./frontend/   — React frontend (will be built here)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/product-catalog"
BACKEND_DIR="$APP_DIR/backend"
UPLOAD_DIR="/var/uploads"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "==> [1/6] Building React frontend"
cd "$PROJECT_ROOT/frontend"

# Ensure VITE_API_URL is set to the production domain
if [ -z "${VITE_API_URL:-}" ]; then
  echo "    WARNING: VITE_API_URL not set. Set it before building:"
  echo "    export VITE_API_URL=https://YOUR_DOMAIN/api/v1"
  echo "    Defaulting to relative path (works when served from same domain)"
fi

npm ci --silent
VITE_API_URL="${VITE_API_URL:-/api/v1}" npm run build
echo "    React build complete: $(du -sh dist | cut -f1)"

echo "==> [2/6] Deploying frontend build"
rm -rf "$APP_DIR"/*.html "$APP_DIR/assets" "$APP_DIR"/*.js "$APP_DIR"/*.ico 2>/dev/null || true
cp -r dist/. "$APP_DIR/"
echo "    Frontend deployed to $APP_DIR"

echo "==> [3/6] Deploying backend"
mkdir -p "$BACKEND_DIR"
# Sync all backend files except node_modules, logs, uploads
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='logs' \
  --exclude='uploads' \
  --exclude='.env' \
  "$PROJECT_ROOT/backend/" "$BACKEND_DIR/"

echo "==> [4/6] Installing production dependencies"
cd "$BACKEND_DIR"
npm ci --production --silent
echo "    Dependencies installed"

echo "==> [5/6] Running database migrations and seeders"
# Check .env exists
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "    ERROR: $BACKEND_DIR/.env not found!"
  echo "    Copy deploy/env.production.template to $BACKEND_DIR/.env and fill in all values."
  exit 1
fi

cd "$BACKEND_DIR"
npx sequelize-cli db:migrate --env production
echo "    Migrations complete"

# Only seed on first deploy (idempotent seeders use upsert, but safer to be explicit)
if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  npx sequelize-cli db:seed:all --env production
  echo "    Seeders complete"
else
  echo "    Skipping seeders (set RUN_SEEDERS=true for first deploy)"
fi

echo "==> [6/6] Starting / reloading PM2"
# Create logs dir
mkdir -p "$BACKEND_DIR/logs"

if pm2 describe product-catalog-api &>/dev/null; then
  pm2 reload product-catalog-api --update-env
  echo "    PM2 process reloaded"
else
  pm2 start "$BACKEND_DIR/ecosystem.config.js" --env production
  pm2 save
  echo "    PM2 process started and saved"
fi

pm2 status

echo ""
echo "✓  Deployment complete."
echo "   Logs: pm2 logs product-catalog-api"
echo "   Status: pm2 status"
