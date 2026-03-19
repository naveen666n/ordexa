#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-dns01.sh  —  Same as deploy.sh but uses manual DNS-01 SSL challenge.
#
# Use this when your DNS provider auto-injects AAAA (IPv6) records that you
# cannot delete (e.g. Hostinger), which breaks the default HTTP-01 challenge.
#
# How it works:
#   Certbot will pause and print a TXT record value. You add that TXT record
#   in your DNS panel (Hostinger), wait ~1-2 min, then press Enter to continue.
#   Certbot verifies ownership via DNS instead of HTTP — AAAA records don't matter.
#
# Usage:
#   chmod +x deploy-dns01.sh
#   DOMAIN=orderdesk.shop DB_PASSWORD=root1234 ./deploy-dns01.sh
#
# Note on renewal:
#   Certs expire every 90 days. Re-run this script to renew, or switch to an
#   automated DNS provider (Cloudflare) later for hands-free renewal.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DOMAIN="${DOMAIN:-YOUR_DOMAIN}"
APP_DIR="/var/www/product-catalog"
UPLOAD_DIR="/var/uploads"
BACKEND_DIR="$APP_DIR/backend"
DB_NAME="product_catalog_prod"
DB_USER="catalog_user"
DB_PASSWORD="${DB_PASSWORD:-CHANGE_ME}"

echo "==> [1/8] Installing system dependencies"
sudo apt-get update -y
sudo apt-get install -y curl git unzip nginx certbot python3-certbot-nginx dnsutils

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

echo "==> [7/8] Nginx: installing HTTP config"
sudo tee /etc/nginx/sites-available/product-catalog > /dev/null <<NGINX
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};
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

echo "==> [8/8] Obtaining SSL certificate via manual DNS-01 challenge"

# Pre-flight: verify A records point to this server
MY_IP=$(curl -4 -sf https://checkip.amazonaws.com || curl -4 -sf https://api.ipify.org || echo "unknown")
DOMAIN_A=$(dig +short A "$DOMAIN" | tail -1)
WWW_A=$(dig +short A "www.$DOMAIN" | tail -1)
echo "    This server's public IP : $MY_IP"
echo "    $DOMAIN A record       : ${DOMAIN_A:-<unresolved>}"
echo "    www.$DOMAIN A record   : ${WWW_A:-<unresolved>}"

if [[ "$DOMAIN_A" != "$MY_IP" || "$WWW_A" != "$MY_IP" ]]; then
  echo ""
  echo "  ERROR: A records do not point to this server ($MY_IP)."
  [[ "$DOMAIN_A" != "$MY_IP" ]] && echo "    SET  A  $DOMAIN      $MY_IP  (currently: ${DOMAIN_A:-unresolved})"
  [[ "$WWW_A"    != "$MY_IP" ]] && echo "    SET  A  www.$DOMAIN  $MY_IP  (currently: ${WWW_A:-unresolved})"
  echo "  Aborting. Fix A records and re-run."
  exit 1
fi

echo ""
echo "  ┌─────────────────────────────────────────────────────────────────┐"
echo "  │  MANUAL STEP REQUIRED — read carefully before pressing Enter    │"
echo "  └─────────────────────────────────────────────────────────────────┘"
echo "  Certbot will now print one or two TXT record values."
echo "  For each one:"
echo "    1. Go to Hostinger hPanel → Domains → $DOMAIN → DNS / Nameservers"
echo "    2. Add a TXT record:"
echo "         Name  : _acme-challenge"
echo "         Value : <the value certbot shows>"
echo "         TTL   : 300"
echo "    3. Wait 1-2 minutes for propagation"
echo "    4. Verify with:  dig +short TXT _acme-challenge.$DOMAIN"
echo "    5. Then press Enter in this terminal to continue"
echo ""
read -rp "  Press Enter when you are ready to start..." _

sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  --agree-tos \
  --email "admin@${DOMAIN}" \
  -d "$DOMAIN" \
  -d "www.$DOMAIN"

# Install the full SSL nginx config
echo ""
echo "==> Applying full SSL nginx config"
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
echo ""
echo "   SSL renewal reminder:"
echo "   Certs expire in 90 days. Re-run this script to renew:"
echo "   DOMAIN=$DOMAIN DB_PASSWORD=<pwd> ./deploy-dns01.sh"
