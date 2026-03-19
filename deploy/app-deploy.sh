#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# app-deploy.sh  —  Deploy / redeploy the application on EC2
# Run after server is set up (deploy.sh already completed), or called
# automatically by deploy.sh on first run.
#
# Usage:
#   DOMAIN=orderdesk.shop \
#   DB_PASSWORD=root1234 \
#   RAZORPAY_KEY_ID=rzp_live_xxx \
#   RAZORPAY_KEY_SECRET=xxx \
#   RAZORPAY_WEBHOOK_SECRET=xxx \
#   RUN_SEEDERS=true \
#   ./app-deploy.sh
#
# Optional env vars:
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET  — leave blank to disable OAuth
#   RUN_SEEDERS=true                        — seed DB on first deploy only
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${DOMAIN:-YOUR_DOMAIN}"
APP_DIR="/var/www/ordex"
BACKEND_DIR="$APP_DIR/backend"
UPLOAD_DIR="/var/uploads"
DB_NAME="product_catalog_prod"
DB_USER="catalog_user"
DB_PASSWORD="${DB_PASSWORD:-CHANGE_ME}"
RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID:-rzp_live_XXXXXXXXXXXXXX}"
RAZORPAY_KEY_SECRET="${RAZORPAY_KEY_SECRET:-CHANGE_ME}"
RAZORPAY_WEBHOOK_SECRET="${RAZORPAY_WEBHOOK_SECRET:-CHANGE_ME}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "==> [1/7] Building React frontend"
cd "$PROJECT_ROOT/frontend"
npm ci --silent
VITE_API_URL="/api/v1" npm run build
echo "    React build complete: $(du -sh dist | cut -f1)"

echo "==> [2/7] Deploying frontend build"
rm -rf "$APP_DIR"/*.html "$APP_DIR/assets" "$APP_DIR"/*.js "$APP_DIR"/*.ico 2>/dev/null || true
cp -r dist/. "$APP_DIR/"
echo "    Frontend deployed to $APP_DIR"

echo "==> [3/7] Deploying backend"
mkdir -p "$BACKEND_DIR"
rsync -av --delete \
  --exclude='node_modules' \
  --exclude='logs' \
  --exclude='uploads' \
  --exclude='.env' \
  "$PROJECT_ROOT/backend/" "$BACKEND_DIR/"

echo "==> [4/7] Installing production dependencies"
cd "$BACKEND_DIR"
npm ci --production --silent
echo "    Dependencies installed"

echo "==> [5/7] Creating .env file"
ENV_FILE="$BACKEND_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  echo "    .env already exists — skipping (delete it to regenerate)"
else
  # Auto-generate secrets
  JWT_ACCESS_SECRET=$(openssl rand -hex 48)
  JWT_REFRESH_SECRET=$(openssl rand -hex 48)
  ENCRYPTION_KEY=$(openssl rand -hex 32)

  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}

# Redis
REDIS_URL=redis://127.0.0.1:6379

# JWT (auto-generated)
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption (auto-generated)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Google OAuth (leave blank to disable)
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=https://${DOMAIN}/api/v1/auth/google/callback

# Razorpay
PAYMENT_GATEWAY=razorpay
RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
RAZORPAY_WEBHOOK_SECRET=${RAZORPAY_WEBHOOK_SECRET}

# App
FRONTEND_URL=https://${DOMAIN}
ALLOWED_ORIGINS=https://${DOMAIN}
UPLOAD_DIR=${UPLOAD_DIR}
MAX_FILE_SIZE=10485760
INVENTORY_BLOCKING_ENABLED=true
EOF
  chmod 600 "$ENV_FILE"
  echo "    .env created at $ENV_FILE"
fi

echo "==> [6/7] Running database migrations"
cd "$BACKEND_DIR"
npx sequelize-cli db:migrate --env production
echo "    Migrations complete"

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  npx sequelize-cli db:seed:all --env production
  echo "    Seeders complete"
else
  echo "    Skipping seeders (set RUN_SEEDERS=true for first deploy)"
fi

echo "==> [7/7] Starting / reloading PM2"
mkdir -p "$BACKEND_DIR/logs"

if pm2 describe product-catalog-api &>/dev/null; then
  pm2 reload product-catalog-api --update-env
  echo "    PM2 process reloaded"
else
  pm2 start "$BACKEND_DIR/ecosystem.config.js" --env production
  pm2 save
  pm2 startup | tail -1 | sudo bash   # auto-start PM2 on reboot
  echo "    PM2 process started and saved"
fi

pm2 status

echo ""
echo "✓  Deployment complete."
echo "   Logs  : pm2 logs product-catalog-api"
echo "   Status: pm2 status"
