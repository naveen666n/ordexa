# Deployment Guide — Product Catalog Platform

Target: **AWS EC2 Ubuntu 22.04 LTS**
Stack: Node.js 20 + MySQL 8 + Redis + Nginx + PM2 + Let's Encrypt SSL

---

## Prerequisites

- EC2 instance running Ubuntu 22.04 (t3.small or larger recommended)
- Elastic IP attached
- Security Groups: open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
- A domain name with an A record pointing to the Elastic IP
- SSH access to the instance

---

## Step 1 — First-time Server Setup

Upload the `deploy/` folder to the EC2 instance, then run:

```bash
# On the EC2 instance
chmod +x deploy.sh
DOMAIN=store.example.com DB_PASSWORD=your_secure_password ./deploy.sh
```

This installs:
- Node.js 20 LTS (via nvm)
- MySQL 8.0 (creates database + user)
- Redis
- Nginx (configured with your domain)
- Certbot + SSL certificate (Let's Encrypt)

---

## Step 2 — Generate Secrets

On your local machine or the EC2 instance:

```bash
# JWT secrets (copy each output into .env)
openssl rand -hex 48   # → JWT_ACCESS_SECRET
openssl rand -hex 48   # → JWT_REFRESH_SECRET

# Encryption key (must be exactly 64 hex chars = 32 bytes)
openssl rand -hex 32   # → ENCRYPTION_KEY
```

---

## Step 3 — Configure Production Environment

```bash
cp deploy/env.production.template /var/www/product-catalog/backend/.env
nano /var/www/product-catalog/backend/.env
```

Fill in **every** `CHANGE_ME` value. Required fields:
- `DB_PASSWORD` — the password you set in Step 1
- `JWT_ACCESS_SECRET` — 48-byte random hex (from Step 2)
- `JWT_REFRESH_SECRET` — different 48-byte random hex
- `ENCRYPTION_KEY` — exactly 64 hex chars (from Step 2)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay dashboard
- `RAZORPAY_WEBHOOK_SECRET` — set in Razorpay webhook settings
- `FRONTEND_URL` / `ALLOWED_ORIGINS` — your domain (e.g. `https://store.example.com`)
- `GOOGLE_CALLBACK_URL` — `https://YOUR_DOMAIN/api/v1/auth/google/callback`

---

## Step 4 — First Deploy

```bash
# From your local machine, in the project root:
export VITE_API_URL=https://YOUR_DOMAIN/api/v1

# On first deploy, also run seeders (roles, admin user, default config)
RUN_SEEDERS=true ./deploy/app-deploy.sh
```

This:
1. Builds the React frontend (`npm run build`)
2. Copies the built files to `/var/www/product-catalog/`
3. Installs backend production dependencies
4. Runs all Sequelize migrations
5. (First deploy only) Runs all seeders
6. Starts the backend with PM2

---

## Step 5 — Configure PM2 Log Rotation

```bash
chmod +x deploy/pm2-logrotate-setup.sh
./deploy/pm2-logrotate-setup.sh
```

---

## Step 6 — Enable PM2 Auto-start on Reboot

```bash
pm2 startup
# Copy and run the command it outputs (starts with "sudo env PATH=...")
pm2 save
```

---

## Subsequent Deploys

```bash
./deploy/app-deploy.sh
```

The script does zero-downtime reload with `pm2 reload`.

---

## Smoke Test Checklist

After deployment, verify each item:

| # | Test | How |
|---|---|---|
| 1 | Homepage loads | `curl -I https://YOUR_DOMAIN` → 200 |
| 2 | API health check | `curl https://YOUR_DOMAIN/api/v1/health` |
| 3 | Admin login | Log in at `https://YOUR_DOMAIN/login` with `admin@example.com` / `Admin@1234` |
| 4 | Create product | Admin → Products → New Product |
| 5 | Product appears in catalog | Browse to `/catalog` |
| 6 | Add to cart + checkout | Create test order |
| 7 | Razorpay payment | Use Razorpay test card: 4111 1111 1111 1111 |
| 8 | Order in Operations | Log in as operations user, see order |
| 9 | Email notification | Check admin email for order confirmation |
| 10 | Config saves | Admin → Config → General → save |
| 11 | Theme change | Admin → Config → Theme → change color → frontend updates |
| 12 | Change admin password | Admin → Users → change default password immediately |

---

## Useful Commands

```bash
# View live logs
pm2 logs product-catalog-api

# Restart backend
pm2 restart product-catalog-api

# Check status
pm2 status

# MySQL shell
mysql -u catalog_user -p product_catalog_prod

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Renew SSL (auto-renewed by certbot timer, manual test)
sudo certbot renew --dry-run
```

---

## Security Checklist (Post-Deploy)

- [ ] Change default admin password (`admin@example.com` / `Admin@1234`)
- [ ] Set `PAYMENT_GATEWAY=razorpay` and add real Razorpay credentials
- [ ] Configure SMTP in Admin → Config → Notifications
- [ ] Set up Razorpay webhook URL: `https://YOUR_DOMAIN/api/v1/payments/webhook/razorpay`
- [ ] Enable Google OAuth in Razorpay dashboard (if using)
- [ ] Remove or restrict SSH access (key-based only, no password auth)
- [ ] Enable AWS CloudWatch or similar for monitoring
- [ ] Set up DB backups (AWS RDS snapshots or `mysqldump` cron job)
