# Product Catalog & Ordering Platform

A white-label, fully configurable product catalog and ordering platform built for multiple clients. Each client gets a separate deployment. The platform supports B2B and B2C customers with three user portals: Customer Storefront, Admin Portal, and Operations Portal.

---

## Features

### Customer Storefront
- Product catalog with category browsing, filtering by attributes (color, size, etc.), price range, and full-text search
- Product detail pages with variant selection, image gallery, and stock indicators
- Shopping cart with persistent storage and quantity management
- Checkout with address management, coupon codes, and Razorpay payment integration
- Order history and order detail pages with status tracking
- Product reviews with star ratings, text, and media (images/videos) — verified purchase required
- Wishlist
- User profile management
- Google OAuth and email/password registration

### Admin Portal
- **Dashboard** — orders today, revenue this month, total products, low-stock alerts, pending reviews
- **Products** — create/edit products with variants (SKU, price, stock), category assignment, image upload, SEO fields
- **Categories** — hierarchical category tree with CRUD
- **Attributes** — manage product attributes (Color, Size, etc.) and their values with filterable/visible toggles
- **Orders** — list and detail view with full status history
- **Users** — create operations users, toggle user status, force password reset
- **Discounts** — coupon codes (%, flat, free shipping, BXGY) and global/festive offers
- **Config** — general settings, theme (CSS variable-based), payment gateway, shipping rules, tax rules, notifications/SMTP, feature flags
- **CMS** — homepage banners, content blocks, email templates
- **Reviews moderation** — approve or reject customer reviews

### Operations Portal
- Orders dashboard with status-based filtering and live counts
- Order processing with step-by-step status progression (Paid → Processing → Shipped → Delivered)
- Visual status stepper and full history log per order

### Discount Engine
- Product-level offers and global/festive offers
- Configurable precedence: `global_wins`, `product_wins`, or `best_deal`
- Coupon codes with expiry, usage limits, per-user limits, and minimum order value
- Offer types: Percentage, Fixed amount, Free shipping, Buy X Get Y

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8 + Sequelize ORM |
| **Cache** | Redis (ioredis) |
| **Auth** | Passport.js — Local + Google OAuth, JWT (access in memory, refresh in HTTP-only cookie) |
| **Validation** | Joi |
| **Payments** | Razorpay (pluggable gateway interface) |
| **Email** | Nodemailer SMTP (credentials configured from Admin UI) |
| **File Storage** | Local disk via Multer (abstracted for S3 migration) |
| **Frontend** | React 18 + Vite |
| **UI** | Tailwind CSS v3 + Shadcn/UI |
| **Server State** | TanStack React Query |
| **Client State** | Zustand |
| **Process Manager** | PM2 |
| **Reverse Proxy** | Nginx |

---

## Project Structure

```
product_order_website/
├── backend/
│   ├── src/
│   │   ├── config/          # env, database, redis, passport
│   │   ├── middleware/       # authenticate, requireRole, auditLog, rateLimiter, errorHandler
│   │   ├── models/          # 30+ Sequelize models
│   │   ├── migrations/      # 36 migration files
│   │   ├── seeders/         # roles, admin, categories, attributes, products, config
│   │   ├── modules/
│   │   │   ├── auth/        # register, login, logout, refresh, OAuth, reset password
│   │   │   ├── catalog/     # products, categories, attributes (public + admin APIs)
│   │   │   ├── cart/        # cart CRUD + coupon application
│   │   │   ├── orders/      # order creation, status transitions, cancellation
│   │   │   ├── payments/    # Razorpay + mock gateway (pluggable interface)
│   │   │   ├── discounts/   # offer engine, coupon service
│   │   │   ├── notifications/ # email + SMS (template-driven, feature-flagged)
│   │   │   ├── reviews/     # verified-purchase reviews with media
│   │   │   ├── wishlist/    # wishlist CRUD
│   │   │   ├── users/       # admin user management
│   │   │   ├── config/      # site config, feature flags
│   │   │   ├── cms/         # content management
│   │   │   ├── shipping/    # shipping rule engine
│   │   │   ├── tax/         # tax rule engine
│   │   │   ├── addresses/   # customer address book
│   │   │   └── admin/       # admin dashboard stats
│   │   └── utils/           # jwt, bcrypt, crypto, cache, response, slugify, logger
│   ├── tests/
│   │   ├── unit/            # offer engine, coupon, JWT, Razorpay, orders, status validator
│   │   └── integration/     # auth flow (register → login → refresh → logout)
│   ├── ecosystem.config.js  # PM2 config
│   └── server.js
├── frontend/
│   └── src/
│       ├── api/             # Axios client + per-module API files
│       ├── components/      # CustomerLayout, AdminLayout, CartDrawer, ProductCard, etc.
│       ├── layouts/         # CustomerLayout, AdminLayout, OperationsLayout, AuthLayout
│       ├── pages/
│       │   ├── customer/    # Home, Catalog, ProductDetail, Cart, Checkout, Orders, Profile, Wishlist
│       │   ├── admin/       # Dashboard, Products, Categories, Attributes, Orders, Users, Discounts, Config, CMS, Reviews
│       │   └── operations/  # OrdersDashboard, OrderProcessing
│       ├── store/           # auth.store, cart.store, ui.store (Zustand)
│       ├── context/         # ConfigContext (theme + public config)
│       └── routes/          # Full router with AuthGuard, RoleGuard, GuestGuard
├── deploy/
│   ├── deploy.sh            # EC2 server setup (Node, MySQL, Redis, Nginx, SSL)
│   ├── app-deploy.sh        # Build + deploy application
│   ├── nginx.conf           # Production Nginx config
│   ├── env.production.template
│   ├── pm2-logrotate-setup.sh
│   └── DEPLOYMENT.md        # Step-by-step deployment guide
├── ARCHITECTURE.md
└── PROJECT_PLAN.md
```

---

## API Overview

108 endpoints across all modules:

| Module | Endpoints |
|---|---|
| Auth | Register, login, logout, refresh token, forgot/reset password, Google OAuth, complete registration |
| Products (public) | List with filters, search, detail by slug |
| Categories & Attributes | List (public + admin CRUD) |
| Cart | Get, add item, update quantity, remove, apply/remove coupon |
| Orders | Create, list, detail, cancel (customer) |
| Payments | Initiate, verify, Razorpay webhook |
| Reviews | List (public), submit, admin approve/delete |
| Wishlist | Get, add, remove |
| Addresses | CRUD |
| Admin — Products | List, detail, create, update, delete, image upload, variant management |
| Admin — Orders | List with filters, detail, status update |
| Admin — Users | List, create, toggle status, reset password |
| Admin — Discounts | Coupon CRUD, global offer CRUD |
| Admin — Config | Get/update config groups, feature flags, test email/SMS |
| Admin — CMS | Get/update content sections |
| Admin — Dashboard | Stats (orders today, revenue, products, alerts) |
| Operations — Orders | Dashboard, status progression with audit log |

All responses use a standard envelope:
```json
{ "success": true, "data": { ... }, "message": "..." }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8 (running on port 3307 locally, or adjust in config)
- Redis

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
# Edit .env — fill in DB credentials, JWT secrets, etc.
```

Required values:
- `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL connection
- `JWT_ACCESS_SECRET` — minimum 32 characters
- `JWT_REFRESH_SECRET` — minimum 32 characters, different from access secret
- `ENCRYPTION_KEY` — exactly 64 hex characters (`openssl rand -hex 32`)

### 3. Set up the database

```bash
cd backend

# Run all 36 migrations
npx sequelize-cli db:migrate

# Seed initial data (roles, admin user, categories, attributes, sample products, default config)
npx sequelize-cli db:seed:all
```

### 4. Start development servers

```bash
# Backend (port 5000)
cd backend
npm run dev

# Frontend (port 3000) — in a separate terminal
cd frontend
npm run dev
```

Visit `http://localhost:3000`

**Default admin credentials:** `admin@example.com` / `Admin@1234`

---

## Running Tests

```bash
cd backend

# All tests (59 total)
npm test

# Unit tests only
npm run test:unit

# Integration tests only (requires running MySQL + Redis)
npm run test:integration
```

### Test Coverage

| Suite | Tests | What's covered |
|---|---|---|
| Offer Engine | 14 | All discount types, precedence scenarios, expiry, inactive offers |
| Coupon Service | 11 | All validation rules, all calculation types |
| JWT Utilities | 5 | Sign/verify, expiry, wrong secret, tampered payload |
| Razorpay Gateway | 5 | Payment signature, webhook signature |
| Orders Service | 6 | Empty cart, insufficient stock, stock decrement, coupon recording, cart clear, notification failure non-blocking |
| Status Validator | 13 | All valid/invalid transitions, cancellable statuses |
| Auth Integration | 5 | Register → login → refresh → logout, wrong password |

---

## Security

- **JWT:** 15-min access tokens in memory + 7-day refresh tokens in HTTP-only cookies, rotated on every use
- **Helmet.js:** Content-Security-Policy (Razorpay-compatible), HSTS, X-Frame-Options, X-Content-Type-Options
- **Rate limiting:** 10 req/15min on auth routes, 200 req/15min general, 500 req/15min admin
- **Input validation:** Joi schemas on every endpoint before service layer
- **XSS prevention:** `xss` library sanitizes all HTML input (product descriptions, CMS, reviews)
- **SQL injection:** All queries via Sequelize parameterized methods; raw SQL uses `replacements` array
- **CORS:** Whitelist-only from `ALLOWED_ORIGINS` environment variable
- **File uploads:** MIME type whitelist (JPEG, PNG, WebP, MP4), UUID filenames, 10MB limit, served by Nginx
- **Secrets in DB:** AES-256 encrypted (`ENCRYPTION_KEY` from env)
- **Audit log:** All admin create/update/delete operations logged to `audit_logs` table
- **Payment webhooks:** HMAC-SHA256 signature verified before processing; raw body preserved for verification

---

## Deployment

See [`deploy/DEPLOYMENT.md`](deploy/DEPLOYMENT.md) for the full step-by-step guide.

**Quick summary:**

```bash
# 1. First-time EC2 setup (installs Node, MySQL, Redis, Nginx, SSL)
DOMAIN=store.example.com DB_PASSWORD=your_password ./deploy/deploy.sh

# 2. Configure production environment
cp deploy/env.production.template /var/www/product-catalog/backend/.env
# Edit .env with production secrets

# 3. Build and deploy (run from project root)
VITE_API_URL=https://store.example.com/api/v1 RUN_SEEDERS=true ./deploy/app-deploy.sh
```

The platform runs on:
- **Nginx** — serves React SPA + proxies `/api/*` to Express, handles SSL termination
- **Express + PM2** — Node.js API server on port 5000, auto-restart on crash/reboot
- **MySQL 8** — primary data store
- **Redis** — catalog cache, session-independent rate limiting

---

## Configuration (Admin UI)

Everything is configurable from the Admin Portal without code changes:

| Section | What you can configure |
|---|---|
| General | Store name, logo, contact email, currency, timezone |
| Theme | Primary/secondary colors, fonts — applied via CSS variables |
| Payment | Select gateway (mock/Razorpay), API keys |
| Shipping | Flat rate rules by weight/order value |
| Tax | Tax rules by category/region |
| Notifications | SMTP host/port/credentials, email templates |
| Feature Flags | Toggle inventory blocking, email/SMS notifications, review system |
| CMS | Homepage banners, promotional content, email template bodies |

---

## Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth tokens | Access in Zustand memory, refresh in HTTP-only cookie | Prevents XSS theft of tokens |
| Payment | Razorpay with pluggable interface | India-first; interface allows switching to Stripe/others |
| Discount | One offer per item (no stacking) | Simplicity; configurable precedence handles edge cases |
| File storage | Local disk (abstracted) | Simpler for v1; interface allows S3 migration without changing callers |
| Email templates | Stored in DB (CMS) | Clients can edit templates without code deployment |
| Order items | JSON snapshot at order time | Order history immune to future product/price changes |
| Search | MySQL FULLTEXT | Sufficient for v1; Elasticsearch can replace via same interface |
| Sequelize config | JS config file for production | Allows reading `DB_*` env vars during migrations |
