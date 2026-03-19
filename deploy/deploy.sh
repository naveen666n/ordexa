#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy.sh  —  Run on the EC2 instance (Ubuntu 22.04)
# Usage: chmod +x deploy.sh && ./deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${DOMAIN:-YOUR_DOMAIN}"          # override: DOMAIN=store.example.com ./deploy.sh
APP_DIR="/var/www/product-catalog"
UPLOAD_DIR="/var/uploads"
BACKEND_DIR="$APP_DIR/backend"
DB_NAME="product_catalog_prod"
DB_USER="catalog_user"
DB_PASSWORD="${DB_PASSWORD:-CHANGE_ME}"  # override from env

echo "==> [1/8] Installing system dependencies"
sudo apt-get update -y
sudo apt-get install -y curl git unzip nginx certbot python3-certbot-nginx

echo "==> [2/8] Installing Node.js 20 LTS via nvm"
if ! command -v nvm &>/dev/null; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  # shellcheck disable=SC1090
  source "$HOME/.nvm/nvm.sh"
fi
nvm install 20
nvm use 20
nvm alias default 20
node --version

echo "==> [3/8] Installing PM2 globally"
npm install -g pm2

echo "==> [4/8] Installing and securing MySQL 8.0"
sudo apt-get install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

# Create DB and user (idempotent)
sudo mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "    MySQL: database '${DB_NAME}' and user '${DB_USER}' ready"

echo "==> [5/8] Installing Redis"
sudo apt-get install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping

echo "==> [6/8] Creating directories and permissions"
sudo mkdir -p "$APP_DIR" "$UPLOAD_DIR"
sudo chown -R "$USER:$USER" "$APP_DIR" "$UPLOAD_DIR"
sudo chmod 755 "$UPLOAD_DIR"

echo "==> [7/8] Nginx: installing temporary HTTP config for certbot"
sudo tee /etc/nginx/sites-available/product-catalog > /dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    root /var/www/product-catalog;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/product-catalog /etc/nginx/sites-enabled/product-catalog
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> [8/8] Obtaining SSL certificate (Let's Encrypt)"
sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" --redirect

# Now install the full SSL nginx config
sudo cp "$(dirname "$0")/nginx.conf" "/etc/nginx/sites-available/product-catalog"
sudo sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/product-catalog
sudo nginx -t
sudo systemctl reload nginx

echo ""
echo "✓  Server setup complete."
echo "   Next steps:"
echo "   1. Copy your project files to $BACKEND_DIR"
echo "   2. Copy deploy/env.production.template → $BACKEND_DIR/.env and fill in values"
echo "   3. Run: ./app-deploy.sh"
