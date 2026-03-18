# Product Catalog & Ordering Platform — Architecture Document

> **Status:** Design Phase (Pre-development)
> **Last Updated:** 2026-03-16

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Requirements Summary](#2-requirements-summary)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Database Design](#5-database-design)
6. [API Design](#6-api-design)
7. [React Frontend Architecture](#7-react-frontend-architecture)
8. [Configurable CMS Design](#8-configurable-cms-design) ← In Progress
9. [Security Design](#9-security-design) ← Pending
10. [Development Roadmap](#10-development-roadmap) ← Pending
11. [Folder Structure](#11-folder-structure) ← Pending

---

## 1. Project Overview

A **white-label, fully configurable Product Catalog & Ordering Platform** built for multiple clients. Each client gets a separate deployment. The platform supports B2B and B2C customers, with three user roles: Admin, Customer, and Operations.

### Key Principles
- Everything configurable from Admin Portal (zero code changes per client)
- Monolith-first, microservice-ready module boundaries
- Pluggable integrations: payment gateways, SMS, email, shipping carriers
- Single EC2 deployment, designed to scale horizontally

---

## 2. Requirements Summary

| Area | Decision |
|---|---|
| Platform type | B2B + B2C, white-label, per-client deployment |
| Scale | Start small, designed for tens of thousands of products |
| Infrastructure | Single EC2 (on-premise), monolith-first |
| Backend | Node.js + Express.js |
| Frontend | React SPA (no SSR) |
| UI Library | Tailwind CSS + Shadcn/UI |
| Database | MySQL |
| Cache | Redis |
| Payment | Razorpay (pluggable gateway interface) |
| Shipping | Flat rate now, pluggable strategy pattern |
| Tax | Rule-based in Admin, pluggable for third-party later |
| Auth — Customer | Google OAuth + Username/Password, registration completion step |
| Auth — Operations | Auto-generated username/password, Admin-managed only |
| Admin Portal | Embedded in same React app (/admin route) |
| CMS | Fully configurable — banners, content, catalog, settings, theme |
| Notifications | SMTP email + SMS (pluggable, credentials via Admin) |
| Search | Full-text + filter/category browsing (MySQL FT for v1) |
| Products | Variant-based, physical goods, inventory blocking at zero stock |
| Discounts | All types (%, flat, free shipping, buy X get Y), product-level + global festive offer, no stacking |
| Reviews | Ratings + text + media (images/videos), Admin moderation |
| Wishlist | Yes |
| Order statuses | Pending → Paid → Processing → Shipped → Delivered → Cancelled |
| SEO | Not required for now |
| Team | Solo developer |

---

## 3. High-Level Architecture

### System Overview

```
EC2 Instance
├── Nginx (port 80/443)
│   ├── Serve React SPA (dist/)
│   └── Proxy /api/* → Express (port 5000)
├── Express API Server (port 5000, PM2)
├── MySQL Database
├── Redis Cache
└── Local File Storage (abstracted for S3 migration)

External Services
├── Razorpay (payment)
├── SMTP Provider (email)
└── SMS Provider (pluggable)
```

### User Roles & Portals

| Role | Access Path | Auth Method |
|---|---|---|
| Customer | `/` | Google OAuth or Username/Password |
| Admin | `/admin` | Username/Password |
| Operations | `/operations` | Auto-generated Username/Password |

### Authentication Flow

```
Customer — Google OAuth:
  Google → OAuth Callback → Check user exists?
    No  → Registration completion step (profile + address) → JWT
    Yes → JWT issued directly

Customer — Username/Password:
  Login → Validate → JWT (access token) + Refresh token (HTTP-only cookie)

Admin/Operations:
  Login → Validate → JWT with role + permissions
```

### JWT Strategy
- **Access Token:** 15 min, stored in memory (React state)
- **Refresh Token:** 7 days, stored in HTTP-only cookie, rotated on use

### Payment Flow

```
Checkout → POST /orders (status: PENDING)
         → POST /payments/initiate → Razorpay API
         → Customer completes payment on Razorpay
         → Webhook received → Verify signature
         → Order status → PAID
         → Notifications sent (email + SMS)
         → Operations team notified
```

### Order Lifecycle

```
PENDING → PAID → PROCESSING → SHIPPED → DELIVERED
                     ↓
                 CANCELLED (only from PENDING/PAID/PROCESSING)
```

### Discount Resolution

```
For each item in cart:
  1. Check product-level offer
  2. Check active global/festive offer
  3. Apply only ONE (based on configured precedence: global_wins | product_wins | best_deal)
  4. Coupon codes applied at order level on top of item offers (if allowed)
```

---

## 4. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 18 | SPA |
| UI Components | Shadcn/UI + Tailwind CSS | Styling, white-label theming via CSS variables |
| Server State | React Query (TanStack) | API data fetching, caching, pagination |
| Client State | Zustand | Cart, auth, UI state |
| Backend Framework | Express.js | REST API server |
| ORM | Sequelize | MySQL interaction, migrations |
| Auth | Passport.js + JWT | Local + Google OAuth strategies |
| Validation | Joi | Request schema validation |
| Password Hashing | bcryptjs | Secure password storage |
| File Uploads | Multer | Media handling (products, reviews) |
| Cache | Redis (ioredis) | Config cache, catalog cache, rate limiting |
| Email | Nodemailer (SMTP) | Transactional notifications |
| Payment | Razorpay (pluggable) | Payment gateway |
| Process Manager | PM2 | Keep Express alive on EC2 |
| Reverse Proxy | Nginx | Serve React + proxy API |

### Pluggable Strategy Pattern (used across)
- **Payment Gateway:** `PaymentGateway` interface → `RazorpayGateway`, `StripeGateway`, etc.
- **Email Provider:** `EmailProvider` interface → `SMTPProvider`, `SendGridProvider`, etc.
- **SMS Provider:** `SMSProvider` interface → `TwilioProvider`, `MSG91Provider`, etc.
- **Shipping Strategy:** `ShippingStrategy` interface → `FlatRateStrategy`, `WeightBasedStrategy`, `CarrierAPIStrategy`, etc.

---

## 5. Database Design

### Tables

| Table | Purpose |
|---|---|
| `roles` | Admin, Customer, Operations |
| `users` | All users (all roles) |
| `refresh_tokens` | JWT refresh token store |
| `password_reset_tokens` | Password reset flow |
| `addresses` | Customer shipping addresses |
| `categories` | Self-referencing category hierarchy |
| `attributes` | Dynamic product attributes (Color, Size, etc.) |
| `attribute_values` | Values per attribute (Red, Blue, XL, etc.) |
| `products` | Product master (with FULLTEXT index) |
| `product_categories` | Product ↔ Category (many-to-many) |
| `product_images` | Multiple images per product/variant |
| `product_variants` | SKU-level variants with price + stock |
| `variant_attribute_values` | Variant ↔ Attribute values (many-to-many) |
| `product_offers` | Product-level discount offers |
| `global_offers` | Festive/global offers (one active at a time) |
| `discount_codes` | Coupon codes |
| `discount_code_usage` | Per-user coupon usage tracking |
| `cart_items` | Active cart per user |
| `orders` | Order header with totals snapshot |
| `order_items` | Line items with price/variant snapshot (JSON) |
| `order_status_history` | Full audit trail of status changes |
| `payments` | Payment records per order |
| `shipping_rules` | Shipping strategy config (JSON strategy config) |
| `tax_rules` | Tax rates by region/category |
| `reviews` | Product reviews with approval workflow |
| `review_media` | Images/videos attached to reviews |
| `wishlist_items` | Customer wishlist |
| `configurations` | Key-value store for all platform settings |
| `cms_content` | CMS content blocks (banners, text, media) |
| `feature_flags` | Feature toggles managed from Admin |
| `notification_logs` | Email/SMS send history |
| `audit_logs` | System-wide admin action audit trail |

### Key Design Decisions

| Decision | Reason |
|---|---|
| `order_items.variant_info` as JSON snapshot | Product/variant can change after order — snapshot preserves what was ordered |
| `configurations` key-value table | All settings (payment, SMTP, SMS, theme) in one queryable table, grouped by `group_key` |
| Self-referencing `categories.parent_id` | Unlimited depth category hierarchy |
| `global_offers.precedence` column | Configurable offer resolution strategy from Admin |
| `review.is_approved` flag | Admin moderation before review goes live |
| Separate `order_status_history` table | Full audit trail of every status change with who changed it |
| `feature_flags` table | Enable/disable features without code deployment |

---

## 6. API Design

### Base URL
```
/api/v1/
```

### Standard Response Envelope
```json
// Success
{ "success": true, "data": { ... }, "message": "..." }

// Paginated
{ "success": true, "data": { "items": [...], "pagination": { "total": 100, "page": 1, "limit": 20, "total_pages": 5 } } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### Endpoint Groups

| Group | Prefix | Access |
|---|---|---|
| Auth | `/api/v1/auth/*` | Public |
| Products | `/api/v1/products/*` | Public |
| Categories + Filters | `/api/v1/categories/*` | Public |
| CMS (public) | `/api/v1/cms/*` | Public |
| Site Config (public) | `/api/v1/config/public` | Public |
| Cart | `/api/v1/cart/*` | Customer |
| Orders | `/api/v1/orders/*` | Customer |
| Payments | `/api/v1/payments/*` | Customer + Webhook |
| Addresses | `/api/v1/addresses/*` | Customer |
| Reviews | `/api/v1/products/:slug/reviews` | Public (GET) / Customer (POST) |
| Wishlist | `/api/v1/wishlist/*` | Customer |
| Admin — Products | `/api/v1/admin/products/*` | Admin |
| Admin — Catalog | `/api/v1/admin/categories/*`, `/api/v1/admin/attributes/*` | Admin |
| Admin — Orders | `/api/v1/admin/orders/*` | Admin |
| Admin — Users | `/api/v1/admin/users/*` | Admin |
| Admin — Discounts | `/api/v1/admin/discount-codes/*`, `/api/v1/admin/global-offers/*` | Admin |
| Admin — Config | `/api/v1/admin/config/*` | Admin |
| Admin — CMS | `/api/v1/admin/cms/*` | Admin |
| Admin — Shipping | `/api/v1/admin/shipping-rules/*` | Admin |
| Admin — Tax | `/api/v1/admin/tax-rules/*` | Admin |
| Operations — Orders | `/api/v1/operations/orders/*` | Operations |

---

## 7. React Frontend Architecture

### Portal Structure (Single React App)

```
React SPA
├── / (Customer Portal)
│   ├── /                     Home
│   ├── /catalog              Product catalog with filters
│   ├── /products/:slug       Product detail
│   ├── /cart                 Cart
│   ├── /checkout             Checkout (auth required)
│   ├── /orders               Order history (auth required)
│   ├── /orders/:number       Order detail (auth required)
│   ├── /profile              Profile + address management (auth required)
│   ├── /wishlist             Wishlist (auth required)
│   ├── /login                Login
│   └── /register             Register
│
├── /admin (Admin Portal — role gated)
│   ├── /admin                Dashboard
│   ├── /admin/products       Product management
│   ├── /admin/catalog        Categories + Attributes
│   ├── /admin/orders         Order management
│   ├── /admin/users          User management
│   ├── /admin/discounts      Coupons + Global offers
│   ├── /admin/config         All platform config (payment, SMTP, SMS, theme, etc.)
│   └── /admin/cms            CMS content management
│
└── /operations (Operations Portal — role gated)
    ├── /operations           Order dashboard
    └── /operations/orders/:number  Order processing
```

### State Management

| State Type | Tool |
|---|---|
| Server/API data | React Query (caching, pagination, background refetch) |
| Auth state (user, token) | Zustand `auth.store.js` |
| Cart state | Zustand `cart.store.js` |
| UI state (modals, drawers) | Zustand `ui.store.js` |
| Site config (CMS, theme) | React Query + ConfigContext |

### White-Label Theming
- Site config loaded at app startup via `GET /api/v1/config/public`
- Theme colors injected as CSS variables on `document.documentElement`
- Logo, favicon, site name all driven from config
- All homepage banners, text, and content sections driven from CMS API

### Key Patterns
- `AuthGuard` — redirects unauthenticated users to login
- `RoleGuard` — redirects users with wrong role to 403
- `GuestGuard` — redirects already-authenticated users away from login/register
- Axios interceptor — auto token refresh on 401 responses
- All API calls abstracted in `src/api/` service layer

---

## 8. Configurable CMS Design

### Core Principle
Every piece of content the customer sees is pulled from the CMS API or Config API — never hardcoded in the frontend.

### Configuration Groups (`configurations` table)

| Group | Keys |
|---|---|
| `general` | site_name, tagline, logo_url, favicon_url, contact_email, currency |
| `theme` | primary_color, secondary_color, accent_color, font_family |
| `payment` | active_gateway, razorpay_key_id, razorpay_key_secret (encrypted) |
| `smtp` | host, port, username, password (encrypted), from_name, from_email |
| `sms` | active_provider, api_key (encrypted), sender_id |
| `shipping` | active_strategy_id |
| `auth` | google_client_id, google_client_secret (encrypted), jwt expiry |
| `social` | facebook_url, instagram_url, twitter_url |

### CMS Content Sections (`cms_content` table)

| Section | Keys |
|---|---|
| `homepage` | hero, banner_1, banner_2, promo_strip, featured_section_title |
| `catalog` | hero, empty_state_text |
| `footer` | about_text, copyright_text, newsletter_text |
| `auth` | login_tagline, register_tagline |
| `emails` | order_confirmation, order_shipped, password_reset (with {{variable}} support) |

### Feature Flags (`feature_flags` table)
Toggles for: reviews, wishlist, google_auth, COD, coupons, global_offer, SMS notifications, product search, B2B mode, inventory blocking, review media.

### Dynamic Attributes & Filters
- Attributes (Color, Size, Material) created in Admin with `is_filterable` flag
- Filter sidebar built dynamically from `/api/v1/categories/:slug/filters`
- Variant matrix auto-generated from attribute combinations
- No hardcoded filter names anywhere in frontend

### Cache Invalidation Strategy
- All config/CMS data cached in Redis (1 hour TTL)
- Admin save action invalidates relevant Redis cache key immediately
- `config:public` → invalidated on any general/theme config change
- `cms:section:{section}` → invalidated on CMS content save
- `config:features` → invalidated on feature flag toggle

---

## 9. Security Design

### Authentication Security
- **JWT:** 15-min access token (React memory) + 7-day refresh token (HTTP-only, Secure, SameSite=Strict cookie)
- **Token Rotation:** Refresh token rotated on every use, stored as bcrypt hash in DB
- **Token Revocation:** All tokens revoked on password change, per-token revocation on logout
- **Passwords:** bcrypt with cost factor 12, strong password rules enforced via Joi
- **Google OAuth:** State param CSRF check, `email_verified: true` required, account linking for duplicate emails

### Authorization (RBAC)
- `authenticate` middleware verifies JWT on all protected routes
- `requireRole(role)` middleware enforces role-based access
- **Resource ownership:** Customers scoped to their own data (`WHERE user_id = req.user.id`)
- Admin cannot access Operations routes; Operations cannot access Admin config

### Input Validation & SQL Injection
- **Joi schemas** on every incoming request body — validated before hitting service layer
- **Sequelize parameterized queries** for all DB access — no string concatenation ever
- Raw queries use `replacements` object syntax only

### XSS Protection
- **Backend:** `xss` library sanitizes all HTML input (product descriptions, CMS content, reviews)
- **Frontend:** `DOMPurify.sanitize()` before any `dangerouslySetInnerHTML` usage
- **HTTP Headers (Nginx):** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Content-Security-Policy`

### Rate Limiting
- Redis-backed `express-rate-limit` — persists across restarts
- **General API:** 200 req / 15 min per IP
- **Auth endpoints:** 10 req / 15 min per IP (brute-force protection)
- **Admin endpoints:** 500 req / 15 min per IP
- **Webhooks:** No rate limit (signature-verified trusted source)

### Payment Security
- Webhook signature verified server-side via HMAC-SHA256 before any order status update
- Frontend payment result NEVER trusted — always re-verified on backend
- Sensitive credentials (API keys, passwords) AES-256 encrypted before storing in `configurations` table

### File Upload Security
- MIME type whitelist (JPEG, PNG, WebP, MP4 only)
- 10MB file size limit, 10 files per request max
- Files renamed to UUID — no original filename stored or exposed
- Files served via Nginx static, not Express (prevents code execution)

### Secrets Management
- All secrets in `.env` file (never committed to git)
- `.env` validated with Joi at startup — app fails fast on missing/invalid secrets
- DB-stored secrets (payment keys, SMTP passwords) AES-256 encrypted with `ENCRYPTION_KEY` from env

### CORS
- Whitelist-based origin validation from `ALLOWED_ORIGINS` env variable
- `credentials: true` required for HTTP-only cookie support

### Audit Logging
- All Admin and Operations actions logged to `audit_logs` table
- Logs include: user_id, action, entity_type, entity_id, old/new values, IP address, user agent
- Implemented as response-finish middleware — no performance impact on request path

---

## 10. Development Roadmap

### Phase Summary

| Phase | Focus | Key Output |
|---|---|---|
| 1 | Project Setup | Running skeleton, DB + Redis connected, Nginx configured |
| 2 | Authentication | Login/register for all roles, JWT + Google OAuth |
| 3 | Product Catalog | Products browsable, variant support, filters, search |
| 4 | Cart | Cart with offer engine + coupon resolution |
| 5 | Orders | Full order lifecycle, address management, operations portal |
| 6 | Payments | Razorpay integrated, webhook verified server-side |
| 7 | Admin Portal | Full platform configurable from UI, white-label theming |
| 8 | Operations Portal | Order processing dashboard |
| 9 | Notifications | Email (SMTP) + SMS on all order events |
| 10 | Polish & Deploy | Tests, security hardening, EC2 production deployment |

### Phase 1 — Project Setup
- Node.js + Express boilerplate with modular folder structure
- Sequelize + MySQL connection + base migrations
- Redis connection + cache utility
- React + Vite + Tailwind + Shadcn/UI scaffold
- Nginx config (SPA fallback + API proxy)
- Environment config with Joi validation
- PM2 ecosystem config

### Phase 2 — Authentication
- Passport local + Google OAuth strategies
- JWT issue/verify/refresh/revoke
- bcrypt password hashing
- Register, login, logout, forgot/reset password
- AuthGuard, RoleGuard, GuestGuard on frontend
- Auto token refresh via Axios interceptor

### Phase 3 — Product Catalog
- Categories (hierarchical), Attributes, Attribute Values
- Products with variants + images
- Dynamic filter endpoint (category-scoped)
- MySQL FULLTEXT search
- Redis caching for catalog + filters
- Admin product management UI (create/edit/variants/images)
- Customer catalog + product detail pages

### Phase 4 — Cart
- Cart CRUD with stock validation
- OfferEngine (product-level vs global offer, configurable precedence)
- CouponService (all types, per-user limits)
- ShippingService (flat rate strategy, pluggable)
- TaxService (rule-based)
- Cart summary with full price breakdown

### Phase 5 — Orders
- Order creation (cart → order, stock decrement, snapshot)
- Order status machine with history
- Cancellation with stock restore
- Address management
- Customer order history + detail
- Operations order dashboard + status update UI

### Phase 6 — Payments
- PaymentGateway interface + RazorpayGateway
- GatewayFactory (config-driven)
- Razorpay checkout modal integration
- Server-side webhook signature verification
- Payment record + order status update on success

### Phase 7 — Admin Portal
- Full config management (payment, SMTP, SMS, theme, shipping, tax)
- CMS content editor (banners, homepage, email templates)
- Feature flag toggles
- Product/category/attribute management
- Discount + offer management
- User management (create ops users, toggle status)
- Dashboard stats
- Audit logging

### Phase 8 — Operations Portal
- Focused order processing dashboard
- Order status stepper + update with notes
- Filtered views by status

### Phase 9 — Notifications
- SMTP email provider (Nodemailer)
- Pluggable SMS interface
- Template renderer with {{variable}} support
- Triggered on: order created, status changed, password reset, welcome
- Notification logs in DB
- Admin test-send buttons

### Phase 10 — Polish & Deployment
- Unit tests: OfferEngine, CouponService, JWT utils, payment verification
- Integration tests: auth flow, checkout flow, order status transitions
- Security hardening: Helmet, CORS, rate limits, CSP headers
- EC2 setup: MySQL, Redis, Node, Nginx, PM2, SSL (Let's Encrypt)
- Production migrations + seed data
- Final smoke testing

---

## 11. Folder Structure

### Backend (Express.js)

```
backend/
├── src/
│   ├── config/           (database, redis, passport, env validation)
│   ├── modules/
│   │   ├── auth/         (routes, controller, service, validation)
│   │   ├── users/        (routes, controller, service, repository)
│   │   ├── catalog/
│   │   │   ├── products/ (routes, controller, service, repository, validation)
│   │   │   ├── categories/
│   │   │   └── attributes/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── payments/
│   │   │   └── gateways/ (interface, factory, razorpay.gateway.js)
│   │   ├── addresses/
│   │   ├── discounts/    (routes, controller, offer.engine.js, coupon.service.js)
│   │   ├── reviews/
│   │   ├── wishlist/
│   │   ├── shipping/
│   │   │   └── strategies/ (interface, flat-rate.strategy.js)
│   │   ├── tax/
│   │   ├── notifications/
│   │   │   ├── email/    (interface, smtp.provider.js)
│   │   │   └── sms/      (interface)
│   │   ├── cms/
│   │   └── config/
│   ├── models/           (all Sequelize models + associations index)
│   ├── middleware/       (authenticate, requireRole, validate, auditLog, rateLimiter, errorHandler)
│   ├── utils/            (jwt, bcrypt, crypto, response, cache, generateOrderNumber)
│   ├── migrations/       (numbered Sequelize migrations)
│   ├── seeders/          (roles, admin user, default config)
│   └── app.js
├── uploads/              (gitignored)
├── .env                  (gitignored)
├── .env.example
├── ecosystem.config.js   (PM2)
└── server.js
```

Each module follows the pattern:
- `routes.js` — URL definitions
- `controller.js` — Request/response handling
- `service.js` — Business logic
- `repository.js` — Database queries
- `validation.js` — Joi schemas

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── api/              (client.js + per-module API services + admin/ subfolder)
│   ├── components/
│   │   ├── ui/           (Shadcn/UI primitives)
│   │   ├── common/       (Navbar, Footer, Loader, Pagination, etc.)
│   │   ├── customer/     (ProductCard, FilterSidebar, CartDrawer, etc.)
│   │   ├── admin/        (DataTable, ProductForm, VariantManager, etc.)
│   │   └── operations/   (OrderStatusStepper, OrderActionPanel)
│   ├── pages/
│   │   ├── customer/     (Home, Catalog, ProductDetail, Cart, Checkout, Orders, Profile, Wishlist, auth/)
│   │   ├── admin/        (Dashboard, products/, catalog/, orders/, users/, discounts/, config/, cms/)
│   │   ├── operations/   (OrdersDashboard, OrderProcessing)
│   │   └── errors/       (NotFound, Unauthorized)
│   ├── layouts/          (CustomerLayout, AdminLayout, OperationsLayout, AuthLayout)
│   ├── routes/           (index.jsx + guards: AuthGuard, RoleGuard, GuestGuard)
│   ├── store/            (auth.store.js, cart.store.js, ui.store.js — Zustand)
│   ├── hooks/            (useAuth, useCart, useConfig, useDebounce, useFilters, useToast)
│   ├── context/          (ConfigContext.jsx — loads + applies white-label config)
│   ├── lib/              (utils, validators, formatters, constants)
│   ├── styles/           (globals.css — Tailwind + CSS variables)
│   └── main.jsx
├── .env
├── vite.config.js
├── tailwind.config.js
└── components.json       (Shadcn/UI config)
```

---

## Notes & Decisions Log

| Date | Decision |
|---|---|
| 2026-03-16 | Platform is white-label; each client gets separate deployment |
| 2026-03-16 | Monolith-first architecture on single EC2 |
| 2026-03-16 | Express.js chosen over NestJS/Fastify (developer familiarity) |
| 2026-03-16 | Razorpay as default payment gateway with pluggable interface |
| 2026-03-16 | Flat rate shipping now, pluggable strategy pattern for future |
| 2026-03-16 | Google OAuth requires registration completion step (profile + address) |
| 2026-03-16 | Operations users are system-managed only (no self-registration, no Google OAuth) |
| 2026-03-16 | Only one discount applies per product (no stacking) — precedence configurable |
| 2026-03-16 | Reviews require Admin approval before going live |
| 2026-03-16 | MySQL FULLTEXT search for v1, Elasticsearch upgrade path kept open |
