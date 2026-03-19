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
# Webroot dir for ACME challenges
sudo mkdir -p /var/www/certbot
sudo tee /etc/nginx/sites-available/product-catalog > /dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # ACME challenge (certbot webroot)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /var/www/product-catalog;
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/product-catalog /etc/nginx/sites-enabled/product-catalog
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

echo "==> [8/8] Obtaining SSL certificate (Let's Encrypt)"

# Pre-flight: verify DNS before attempting cert issuance
MY_IP=$(curl -4 -sf https://checkip.amazonaws.com || curl -4 -sf https://api.ipify.org || echo "unknown")
DOMAIN_A=$(dig +short A "$DOMAIN" | tail -1)
WWW_A=$(dig +short A "www.$DOMAIN" | tail -1)
DOMAIN_AAAA=$(dig +short AAAA "$DOMAIN" | tail -1)
WWW_AAAA=$(dig +short AAAA "www.$DOMAIN" | tail -1)
echo "    This server's public IP  : $MY_IP"
echo "    $DOMAIN A record        : ${DOMAIN_A:-<unresolved>}"
echo "    www.$DOMAIN A record    : ${WWW_A:-<unresolved>}"
echo "    $DOMAIN AAAA record     : ${DOMAIN_AAAA:-(none — good)}"
echo "    www.$DOMAIN AAAA record : ${WWW_AAAA:-(none — good)}"

DNS_OK=true
if [[ -n "$DOMAIN_AAAA" || -n "$WWW_AAAA" ]]; then
  echo ""
  echo "  ERROR: AAAA (IPv6) records still exist!"
  echo "  Let's Encrypt prefers IPv6 and will reach the wrong server."
  echo "  Delete these from your DNS panel, then re-run:"
  [[ -n "$DOMAIN_AAAA" ]]     && echo "    DELETE  AAAA  $DOMAIN      $DOMAIN_AAAA"
  [[ -n "$WWW_AAAA" ]]        && echo "    DELETE  AAAA  www.$DOMAIN  $WWW_AAAA"
  DNS_OK=false
fi
if [[ "$DOMAIN_A" != "$MY_IP" || "$WWW_A" != "$MY_IP" ]]; then
  echo ""
  echo "  ERROR: A records do not point to this server ($MY_IP)."
  echo "  Set in your DNS panel:"
  [[ "$DOMAIN_A" != "$MY_IP" ]]  && echo "    SET  A  $DOMAIN      $MY_IP  (currently: ${DOMAIN_A:-unresolved})"
  [[ "$WWW_A" != "$MY_IP" ]]     && echo "    SET  A  www.$DOMAIN  $MY_IP  (currently: ${WWW_A:-unresolved})"
  echo "  Then wait for propagation: dig +short A $DOMAIN"
  DNS_OK=false
fi
if [[ "$DNS_OK" != "true" ]]; then
  echo ""
  echo "  Aborting. Fix DNS issues above and re-run this script."
  exit 1
fi

sudo certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos --email "admin@${DOMAIN}"

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
