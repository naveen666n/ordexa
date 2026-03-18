# Project Execution Plan
# Product Catalog & Ordering Platform

> **Architecture Document:** `ARCHITECTURE.md` (read this before every session)
> **Last Updated:** 2026-03-16
> **Developer:** Solo
> **Stack:** Node.js + Express · React · MySQL · Redis · Tailwind + Shadcn/UI

---

## How To Use This Document

1. Before every session, read the **Session Prompt** exactly as written
2. Paste the prompt into a new Claude Code session
3. After completing a session, check off the tasks under **Deliverables**
4. Update **Session Status** (Pending → In Progress → Done)
5. Note any deviations or decisions in the **Session Notes** column

---

## Progress Tracker

| Session | Focus | Status | Notes |
|---|---|---|---|
| S01 | Backend Project Setup | Done | |
| S02 | Frontend Project Setup | Done | |
| S03 | Auth — Backend | Done | |
| S04 | Auth — Frontend | Done | |
| S05 | Catalog Backend — Categories & Attributes | Done | |
| S06 | Catalog Backend — Products & Variants | Done | |
| S07 | Catalog Frontend | Done | |
| S08 | Cart — Backend | Done | |
| S09 | Cart — Frontend | Done | |
| S10 | Orders — Backend | Done | |
| S11 | Orders — Frontend (Customer) | Done | |
| S12 | Payments — Backend | Done | |
| S13 | Payments — Frontend | Done | |
| S14 | Admin Portal — Products & Catalog | Done | |
| S15 | Admin Portal — Config & CMS | Done | |
| S16 | Admin Portal — Orders, Users & Discounts | Done | |
| S17 | Operations Portal | Done | |
| S18 | Notifications | Done | |
| S19 | Reviews & Wishlist | Done | |
| S20 | Security Hardening | Done | |
| S21 | Testing | Done | |
| S22 | EC2 Deployment | Done | |

---

---

## SESSION 01 — Backend Project Setup

**Goal:** Runnable Express server with DB, Redis, folder structure, and base utilities.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize ORM), Redis (ioredis), JWT auth.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Working directory: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend

TASK — Backend Project Setup:

1. Initialize Node.js project with package.json
2. Install all backend dependencies:
   express, sequelize, mysql2, ioredis, dotenv, cors, helmet, morgan,
   compression, joi, bcryptjs, jsonwebtoken, passport, passport-local,
   passport-google-oauth20, multer, razorpay, nodemailer, express-rate-limit,
   rate-limit-redis, uuid, xss, dompurify, jsdom
   devDependencies: nodemon
3. Create the full backend folder structure exactly as defined in ARCHITECTURE.md Section 11
4. Create src/config/env.js — Joi validation for all required env variables
5. Create src/config/database.js — Sequelize instance with MySQL connection
6. Create src/config/redis.js — ioredis client with reconnect handling
7. Create src/utils/response.js — success() and error() response helpers
8. Create src/utils/cache.js — get, set, del, invalidatePattern helpers using Redis
9. Create src/middleware/errorHandler.js — global Express error handler
10. Create src/app.js — Express app with: cors, helmet, morgan, compression,
    express.json, rate limiter placeholder, route mounting placeholder
11. Create server.js — starts HTTP server, connects DB and Redis before listening
12. Create .env.example with all required keys (no values)
13. Create .gitignore
14. Create ecosystem.config.js for PM2
15. Run first migration: create roles table and seed it with admin, customer, operations

Do not write auth, models beyond roles, or any business logic yet.
Confirm server starts with: node server.js
```

### Deliverables
```
□ backend/ folder initialized
□ All dependencies installed (package.json)
□ Full folder structure created
□ env.js validation works
□ DB connection works (sequelize.authenticate())
□ Redis connection works
□ response.js helpers work
□ app.js starts without errors
□ roles table exists and seeded
□ .env.example created
□ ecosystem.config.js created
```

---

## SESSION 02 — Frontend Project Setup

**Goal:** React app scaffolded with routing, state management, Tailwind, Shadcn/UI, and all placeholder pages.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React 18 + Vite, Tailwind CSS, Shadcn/UI, Zustand, React Query (TanStack), React Router v6, Axios.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Working directory: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend

TASK — Frontend Project Setup:

1. Initialize React + Vite project
2. Install all dependencies:
   react-router-dom, axios, @tanstack/react-query, zustand,
   tailwindcss, postcss, autoprefixer, @shadcn/ui, lucide-react,
   dompurify, clsx, tailwind-merge
3. Configure Tailwind CSS with CSS variable support for theming
4. Initialize Shadcn/UI (components.json)
5. Install Shadcn components: button, input, card, badge, dialog,
   select, table, toast, dropdown-menu, sheet, separator, label,
   form, tabs, avatar, skeleton
6. Create the full frontend folder structure exactly as defined in ARCHITECTURE.md Section 11
7. Create src/lib/utils.js — cn() helper (clsx + tailwind-merge)
8. Create src/lib/constants.js — ORDER_STATUSES, ROLES, API_BASE_URL
9. Create src/lib/formatters.js — formatCurrency(), formatDate()
10. Create src/api/client.js — Axios instance with:
    - baseURL from VITE_API_URL
    - withCredentials: true
    - Request interceptor: attach access token from auth store
    - Response interceptor: auto-refresh on 401 (call /auth/refresh-token)
11. Create src/store/auth.store.js — Zustand: user, accessToken, isAuthenticated, setAuth, clearAuth, updateUser
12. Create src/store/cart.store.js — Zustand: items, itemCount, subtotal, coupon, setCart, reset
13. Create src/store/ui.store.js — Zustand: isCartDrawerOpen, activeModal, openCartDrawer, closeCartDrawer, openModal, closeModal
14. Create src/context/ConfigContext.jsx — provider that fetches /api/v1/config/public, applies CSS variables for theme, sets document.title and favicon
15. Create all route guards:
    - AuthGuard.jsx — redirect to /login if not authenticated
    - RoleGuard.jsx — redirect to /unauthorized if role doesn't match
    - GuestGuard.jsx — redirect to / if already authenticated
16. Create placeholder pages for ALL pages listed in ARCHITECTURE.md Section 11
    (just a div with the page name for now — no real content)
17. Create all layouts: CustomerLayout, AdminLayout, OperationsLayout, AuthLayout
    (with basic nav placeholder)
18. Create src/routes/index.jsx with ALL routes wired up exactly as designed
    in ARCHITECTURE.md Section 6.2
19. Create .env with VITE_API_URL=http://localhost:5000/api/v1
20. Confirm app runs: npm run dev — all routes accessible without errors

Do not implement any real page content yet. Placeholders only.
```

### Deliverables
```
□ React + Vite project initialized
□ Tailwind + Shadcn/UI configured
□ Full folder structure created
□ Zustand stores created
□ Axios client with interceptors
□ ConfigContext provider
□ All route guards created
□ All placeholder pages created
□ All layouts created
□ Full router wired
□ App runs without errors
```

---

## SESSION 03 — Authentication Backend

**Goal:** All auth endpoints working. JWT + Google OAuth fully functional.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize), JWT, Passport.js (local + Google OAuth), bcryptjs.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Session 01 is complete: Express server runs, DB + Redis connected, roles table seeded.

TASK — Authentication Backend:

1. Create Sequelize migrations and models for:
   - users (all fields from ARCHITECTURE.md Section 5 — Database Design)
   - refresh_tokens
   - password_reset_tokens
2. Create src/utils/jwt.js — signAccessToken(), signRefreshToken(), verifyToken()
3. Create src/utils/bcrypt.js — hashPassword(), comparePassword()
4. Create src/utils/crypto.js — AES-256 encrypt() and decrypt() for secrets
5. Configure Passport in src/config/passport.js:
   - LocalStrategy (email + password)
   - GoogleStrategy (OAuth 2.0)
6. Create src/middleware/authenticate.js — verify JWT, attach req.user
7. Create src/middleware/requireRole.js — check req.user.role against allowed roles
8. Create Joi validation schemas in src/modules/auth/auth.validation.js
9. Build auth service in src/modules/auth/auth.service.js:
   - register(data) — hash password, create user, issue tokens
   - login(email, password) — verify, issue tokens
   - googleLogin(profile) — find or create user, check registration_completed
   - completeRegistration(userId, data) — update profile + create first address
   - refreshToken(token) — rotate refresh token
   - logout(token) — revoke refresh token
   - forgotPassword(email) — create reset token, return it (email in Phase 9)
   - resetPassword(token, newPassword) — verify token, update password, revoke all refresh tokens
10. Build auth controller in src/modules/auth/auth.controller.js
11. Build auth routes in src/modules/auth/auth.routes.js:
    POST /auth/register
    POST /auth/login
    POST /auth/logout
    POST /auth/refresh-token
    POST /auth/forgot-password
    POST /auth/reset-password
    GET  /auth/google
    GET  /auth/google/callback
    POST /auth/complete-registration
12. Apply rate limiting on auth routes (10 req/15min)
13. Mount auth routes in app.js
14. Seed one admin user for testing
15. Test all endpoints with a REST client (document working responses)

Key rules from architecture:
- Refresh token stored as bcrypt hash in DB
- Refresh token set as HTTP-only, Secure, SameSite=Strict cookie
- Access token in response body only
- On password change: revoke ALL refresh tokens for that user
- Google OAuth: require email_verified=true
- registration_completed flag: false until complete-registration called
```

### Deliverables
```
□ users, refresh_tokens, password_reset_tokens migrations + models
□ JWT utilities (sign, verify)
□ bcrypt utilities
□ crypto utilities (AES-256)
□ Passport local + Google strategies
□ authenticate middleware
□ requireRole middleware
□ All auth service methods
□ All auth endpoints responding correctly
□ Rate limiting on auth routes
□ Admin seed user works
□ Refresh token rotation works
□ Password reset flow works
```

---

## SESSION 04 — Authentication Frontend

**Goal:** All auth pages functional. Login, register, Google OAuth, token refresh all working end-to-end.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Zustand, React Query, Axios, Tailwind + Shadcn/UI.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Backend auth is running at: http://localhost:5000/api/v1

Sessions 01–03 complete:
- Frontend scaffold complete (all placeholder pages, routing, guards, stores)
- Backend auth endpoints all working

TASK — Authentication Frontend:

1. Create src/api/auth.api.js — all auth API calls (register, login, logout, refreshToken, forgotPassword, resetPassword, completeRegistration)
2. Build LoginPage.jsx:
   - Email + password form with validation
   - Google OAuth button (redirect to /api/v1/auth/google)
   - Error display
   - Link to register
3. Build RegisterPage.jsx:
   - First name, last name, email, password, phone
   - Password strength indicator
   - Error display
4. Build ForgotPasswordPage.jsx and reset flow
5. Build CompleteRegistrationPage.jsx:
   - Profile fields + address form
   - Required for Google OAuth new users
6. Wire Zustand auth store:
   - setAuth() called after successful login/register
   - clearAuth() called on logout
7. Implement Axios interceptor properly:
   - On 401: call /auth/refresh-token → get new access token → retry original request
   - On refresh failure: clear auth + redirect to /login
8. Implement AuthGuard — check isAuthenticated, redirect to /login
9. Implement GuestGuard — if authenticated, redirect to / (or /admin if admin role)
10. Implement RoleGuard — check user.role, redirect to /unauthorized if mismatch
11. Show user name + avatar in Navbar when logged in
12. Show Login button in Navbar when logged out
13. Logout button clears auth store + calls logout API
14. After Google OAuth callback: check registration_completed flag
    → if false → redirect to /auth/complete
    → if true → redirect to /
15. Handle all error states (wrong password, email exists, etc.)

Test checklist:
- Customer can register, login, logout
- Google OAuth opens Google, returns to app, completes registration
- Token auto-refreshes silently on expiry
- Admin login redirects to /admin
- Operations login redirects to /operations
- Unauthenticated user redirected to /login on protected pages
- Wrong role gets /unauthorized page
```

### Deliverables
```
□ auth.api.js complete
□ LoginPage functional
□ RegisterPage functional
□ ForgotPassword + ResetPassword functional
□ CompleteRegistrationPage functional
□ Google OAuth full flow works
□ Axios token refresh interceptor works
□ AuthGuard, RoleGuard, GuestGuard all work
□ Navbar reflects auth state
□ Logout works
```

---

## SESSION 05 — Catalog Backend: Categories & Attributes

**Goal:** Category hierarchy and dynamic attribute system fully functional via API.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize), Redis caching.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Sessions 01–03 complete: Auth fully working.

TASK — Catalog Backend: Categories & Attributes:

1. Create Sequelize migrations and models:
   - categories (self-referencing parent_id for hierarchy)
   - attributes (name, slug, type, is_filterable, is_visible, sort_order)
   - attribute_values (attribute_id, value, slug, color_hex, sort_order)
2. Build categories module (routes, controller, service, repository):
   GET    /api/v1/categories              — full tree (public, cached)
   GET    /api/v1/categories/:slug        — single category detail
   POST   /api/v1/admin/categories        — create (admin)
   PUT    /api/v1/admin/categories/:id    — update (admin)
   DELETE /api/v1/admin/categories/:id   — delete (admin)
   - Tree builder: recursive or CTE query for nested structure
   - Cache category tree in Redis (30 min TTL)
   - Invalidate cache on create/update/delete
3. Build attributes module (routes, controller, service, repository):
   GET    /api/v1/admin/attributes        — list all attributes (admin)
   POST   /api/v1/admin/attributes        — create attribute (admin)
   PUT    /api/v1/admin/attributes/:id    — update attribute (admin)
   DELETE /api/v1/admin/attributes/:id
   POST   /api/v1/admin/attributes/:id/values     — add value
   PUT    /api/v1/admin/attributes/:id/values/:vid — update value
   DELETE /api/v1/admin/attributes/:id/values/:vid
4. Apply authenticate + requireRole('admin') middleware on all /admin routes
5. Add Joi validation for all request bodies
6. Seed a few test categories and attributes

Key rules:
- Category slug must be unique, auto-generated from name if not provided
- Attribute type: select, multiselect, text, number, boolean
- is_filterable=true attributes appear in catalog filter sidebar
- Deleting a category with children should be blocked or cascade (decide and document)
```

### Deliverables
```
□ categories migration + model (self-referencing)
□ attributes migration + model
□ attribute_values migration + model
□ Category tree endpoint working (nested structure)
□ Category CRUD (admin) working
□ Attribute CRUD (admin) working
□ Attribute value CRUD (admin) working
□ Redis caching on category tree
□ Joi validation on all endpoints
□ Test seed data created
```

---

## SESSION 06 — Catalog Backend: Products & Variants

**Goal:** Full product management with variants, images, inventory, search, and filters.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize), Redis, Multer (file uploads).
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Sessions 01–05 complete: Auth + Categories + Attributes working.

TASK — Catalog Backend: Products & Variants:

1. Create Sequelize migrations and models:
   - products (with FULLTEXT index on name, description, brand)
   - product_categories (many-to-many join)
   - product_images (product_id, variant_id nullable, url, is_primary, sort_order)
   - product_variants (product_id, sku, price, compare_price, stock_quantity, low_stock_threshold)
   - variant_attribute_values (many-to-many join)
2. Setup Multer + StorageService abstraction:
   - src/modules/storage/storage.service.js — interface: upload(file), delete(path)
   - src/modules/storage/local.storage.js — saves to /uploads, returns path
   - File validation: JPEG/PNG/WebP/MP4 only, 10MB max
   - Files renamed to UUID to prevent path traversal
3. Build products module:
   GET    /api/v1/products                — listing (public)
     - Query params: page, limit, category, sort, min_price, max_price, attributes (JSON), in_stock, featured
     - Returns: product list with primary image, price range, rating_avg, offer
     - Cache by filter fingerprint in Redis (10 min)
   GET    /api/v1/products/search?q=      — FULLTEXT search (public)
   GET    /api/v1/products/:slug          — full detail with variants + attributes (public)
   GET    /api/v1/categories/:slug/filters — dynamic filter options with counts (public, cached 30min)
   POST   /api/v1/admin/products          — create product (admin)
   PUT    /api/v1/admin/products/:id      — update product (admin)
   DELETE /api/v1/admin/products/:id      — soft delete / deactivate (admin)
   POST   /api/v1/admin/products/:id/images         — upload images (admin, multipart)
   DELETE /api/v1/admin/products/:id/images/:imgId  — delete image (admin)
   POST   /api/v1/admin/products/:id/variants        — add variant (admin)
   PUT    /api/v1/admin/products/:id/variants/:vid   — update variant (admin)
   DELETE /api/v1/admin/products/:id/variants/:vid  — deactivate variant (admin)
4. Inventory rule: if stock_quantity = 0 and feature flag inventory_blocking_enabled = true → is_in_stock = false
5. Cache invalidation: invalidate product listing cache on any product/variant change
6. Add Joi validation for all admin endpoints
7. Seed 5–10 test products with variants

Key rules from architecture:
- Product listing must return price_range (min/max across all variants)
- Product detail must return all variants with their attribute value combinations
- Filter endpoint must return value counts (how many products per attribute value)
- Slug must be unique, auto-generated from name if not provided
- FULLTEXT search on name + description + brand
```

### Deliverables
```
□ All product/variant/image migrations + models
□ StorageService abstraction (local storage)
□ Product listing endpoint with all filters + pagination
□ Product search endpoint (FULLTEXT)
□ Product detail endpoint (full variant + attribute data)
□ Dynamic filter endpoint
□ Admin product CRUD
□ Image upload/delete (Multer)
□ Variant CRUD
□ Inventory blocking via feature flag
□ Redis caching on listing + filters
□ Test seed products with variants
```

---

## SESSION 07 — Catalog Frontend

**Goal:** Customers can browse products, filter, search, and view product details.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI, React Query, Zustand.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–06 complete: Auth frontend works. Backend catalog APIs all running.

TASK — Catalog Frontend:

1. Create src/api/products.api.js — list(), getBySlug(), search()
2. Create src/api/categories.api.js — getTree(), getFilters(slug)
3. Build HomePage.jsx:
   - HeroBanner — reads from ConfigContext (cms homepage.hero data)
   - FeaturedCategories — from category API (is_featured flag)
   - FeaturedProducts grid — products?featured=true
   - Promo strip (announcement bar) — from CMS config
   - For now use placeholder data if CMS not set up yet
4. Build CatalogPage.jsx:
   - URL-driven filters (?category=men&color=red&size=xl&min_price=100)
   - FilterSidebar: dynamic from /categories/:slug/filters API
     - Price range slider
     - Per-attribute checkbox filter (color swatches for Color attribute)
     - In stock toggle
   - SortDropdown (price_asc, price_desc, newest, rating)
   - ProductGrid with ProductCard components
   - ActiveFilterChips (show applied filters, click to remove)
   - Pagination
   - Loading skeletons while fetching
5. Build ProductCard.jsx:
   - Primary image, product name, price, compare_price (strikethrough)
   - OfferBadge (e.g. "10% OFF")
   - StarRating display
   - WishlistButton (heart icon, calls API if authenticated)
6. Build ProductDetailPage.jsx:
   - ProductImageGallery (main image + thumbnails, changes on variant select)
   - Product name, brand, rating summary
   - PriceDisplay (variant price + compare_price + offer)
   - VariantSelector:
     - Renders one selector group per attribute (Color, Size, etc.)
     - Color attribute shows color swatches
     - Other attributes show button selectors
     - Selecting a combination highlights the matching variant
     - Shows "Out of Stock" if selected variant stock = 0
   - Stock indicator (In Stock / Low Stock / Out of Stock)
   - Add to Cart button (disabled if out of stock)
   - WishlistButton
   - Tabs: Description | Reviews (reviews placeholder for now)
7. Build search bar in Navbar — debounced input → /products/search → dropdown results
8. Build CategoryTree navigation (horizontal nav bar or sidebar)
9. Connect useConfig() hook to apply all CMS content where possible

Key rules:
- URL must reflect active filters (use query params, support browser back/forward)
- VariantSelector must correctly identify which variant is selected from attribute combo
- Cart add does NOT open checkout — just adds to cart store + shows cart drawer
```

### Deliverables
```
□ products.api.js + categories.api.js
□ HomePage with CMS-driven sections
□ CatalogPage with dynamic filters (URL-driven)
□ FilterSidebar (dynamic attributes from API)
□ ProductCard with offer badge + rating
□ ProductDetailPage with VariantSelector
□ Image gallery with variant-switching
□ Search bar with debounced results
□ Add to cart (UI only — wires to cart store)
□ WishlistButton (calls API if authenticated)
□ Loading skeletons on all data fetches
```

---

## SESSION 08 — Cart Backend

**Goal:** Full cart system with offer engine, coupon resolution, shipping, and tax.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize), Redis.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Sessions 01–06 complete: Auth + full catalog backend working.

TASK — Cart Backend:

1. Create Sequelize migrations and models:
   - cart_items (user_id, variant_id, quantity — unique on user+variant)
   - product_offers (product_id, offer_type, discount_value, buy_quantity, get_quantity, min_order_value, starts_at, ends_at, is_active)
   - global_offers (name, offer_type, discount_value, buy_quantity, get_quantity, min_order_value, starts_at, ends_at, is_active, precedence)
   - discount_codes (all fields from ARCHITECTURE.md)
   - discount_code_usage (discount_code_id, user_id, order_id)
2. Build src/modules/discounts/offer.engine.js:
   - getActiveProductOffer(productId) — returns active product offer if any
   - getActiveGlobalOffer() — returns active global offer if any
   - resolveOffer(productId) — applies precedence logic:
     - global_wins: global offer always wins
     - product_wins: product offer wins if exists, else global
     - best_deal: whichever gives higher discount wins
   - calculateOfferDiscount(offer, unitPrice, quantity) — returns discount amount
3. Build src/modules/discounts/coupon.service.js:
   - validateCoupon(code, userId, cartSubtotal) — checks active, expiry, usage, min order
   - calculateCouponDiscount(coupon, cart) — returns discount amount
   - recordUsage(couponId, userId, orderId) — called when order is placed
4. Build src/modules/shipping/strategies/flat-rate.strategy.js:
   - calculate(order) — reads flat rate from active shipping_rule config
5. Build src/modules/tax/tax.service.js:
   - calculate(cartItems, addressId) — match tax rules by region/category
6. Build cart module (routes, controller, service, repository):
   GET    /api/v1/cart                  — get cart with offer-applied prices
   POST   /api/v1/cart/items            — add item (check stock, check feature flag)
   PUT    /api/v1/cart/items/:variantId — update quantity
   DELETE /api/v1/cart/items/:variantId — remove item
   DELETE /api/v1/cart                  — clear cart
   POST   /api/v1/cart/apply-coupon     — validate + store coupon on cart session
   DELETE /api/v1/cart/remove-coupon    — remove coupon
   POST   /api/v1/cart/summary          — full price breakdown (needs address_id)
7. Cart GET response must include:
   - Each item with offer applied (resolved via OfferEngine)
   - Line total after offer discount
   - Applied coupon info
   - Item count + subtotal
8. Cart summary response must include:
   - subtotal, discount_amount, discount_source, shipping_amount, tax_amount, total_amount
9. Admin discount endpoints:
   GET/POST/PUT/DELETE /api/v1/admin/discount-codes
   GET/POST/PUT/DELETE /api/v1/admin/global-offers
   PATCH /api/v1/admin/global-offers/:id/activate — sets is_active=true, deactivates all others

Key rules from architecture:
- Only ONE offer applies per product (no stacking)
- Coupon applied at cart level, not item level
- Stock check on add to cart: reject if stock = 0 and inventory_blocking_enabled = true
- Cart is persisted in DB (not session) — user can switch devices
```

### Deliverables
```
□ cart_items, product_offers, global_offers, discount_codes, discount_code_usage models
□ OfferEngine with all three precedence modes
□ CouponService (validate + calculate + record)
□ FlatRateShipping strategy
□ TaxService (rule-based)
□ All cart endpoints working
□ Cart GET returns offer-resolved prices
□ Cart summary returns full price breakdown
□ Apply/remove coupon working
□ Admin discount code CRUD
□ Admin global offer CRUD + activate
```

---

## SESSION 09 — Cart Frontend

**Goal:** Full cart UI — drawer, cart page, coupon input, price summary, checkout entry.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI, React Query, Zustand.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–08 complete: Auth frontend + full catalog frontend + cart backend all working.

TASK — Cart Frontend:

1. Create src/api/cart.api.js — get(), addItem(), updateItem(), removeItem(), clear(), applyCoupon(), removeCoupon(), getSummary()
2. Build CartDrawer.jsx (Shadcn Sheet component, slides in from right):
   - CartItem components with quantity controls (+/-) and remove button
   - Shows offer badge if offer applied to item
   - Coupon input section
   - Subtotal display
   - "View Cart" and "Checkout" buttons
   - Empty state
   - Loading state
3. Build CartPage.jsx (full page):
   - Same CartItem list
   - Coupon code input with apply/remove
   - Order Summary sidebar:
     - Subtotal, discount amount (label shows source), shipping, tax, total
     - "Proceed to Checkout" button
4. Build CartItem.jsx:
   - Product image + name + variant info (Color: Red, Size: XL)
   - Unit price + offer badge
   - Quantity selector (+/- with min=1, max=stock_quantity)
   - Remove button
   - Line total
5. Wire "Add to Cart" button on ProductDetailPage:
   - Calls cart API
   - On success: update cart store + open CartDrawer
   - Show loading state on button
   - Show error if out of stock
6. Cart item count badge on Navbar cart icon
7. Sync cart store from API on app load (if authenticated)
8. Build WishlistPage.jsx:
   - List of wishlisted products
   - Remove from wishlist button
   - "Add to Cart" button per item
9. Create src/api/wishlist.api.js — get(), add(), remove()

Key rules:
- Cart drawer opens automatically when item added
- Quantity change calls API immediately (optimistic update)
- Coupon error messages shown inline (invalid code, expired, limit reached)
- Cart persisted in DB — reload should restore cart
```

### Deliverables
```
□ cart.api.js complete
□ CartDrawer (Shadcn Sheet) fully functional
□ CartPage with full price breakdown
□ CartItem with quantity controls
□ Add to Cart wired on ProductDetailPage
□ Cart item count badge on Navbar
□ Cart loads from API on app start
□ Coupon input with error handling
□ WishlistPage functional
□ wishlist.api.js complete
```

---

## SESSION 10 — Orders Backend

**Goal:** Full order lifecycle with address management, status machine, and operations API.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize).
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Sessions 01–09 complete: Auth + Catalog + Cart backend all working.

TASK — Orders Backend:

1. Create Sequelize migrations and models:
   - addresses (user_id, label, full_name, phone, address_line1/2, city, state, postal_code, country, is_default)
   - orders (all fields from ARCHITECTURE.md — order_number, user_id, address_id, status, totals, discount info)
   - order_items (with product_name + variant_info JSON snapshot)
   - order_status_history (order_id, from_status, to_status, changed_by, note)
2. Build addresses module:
   GET    /api/v1/addresses
   POST   /api/v1/addresses
   PUT    /api/v1/addresses/:id
   DELETE /api/v1/addresses/:id
   PATCH  /api/v1/addresses/:id/set-default
   - Enforce: user can only access their own addresses
   - Max 1 default address per user (setting new default unsets old)
3. Build order creation service (src/modules/orders/orders.service.js):
   createOrder(userId, { address_id, coupon_code, notes }):
     a. Load cart items — validate stock for each (reject if any out of stock)
     b. Resolve offers (OfferEngine) for each item
     c. Validate coupon (CouponService) if provided
     d. Calculate shipping (ShippingService)
     e. Calculate tax (TaxService)
     f. Create order record with final totals
     g. Create order_items — SNAPSHOT product_name + variant_info at this moment
     h. Decrement stock_quantity on each variant
     i. Record coupon usage (discount_code_usage) if coupon used
     j. Clear cart
     k. Generate order_number (format: ORD-YYYY-XXXXX)
     l. Create initial status history entry (null → pending)
     m. Return order + payment initiation data
4. Build order routes (customer):
   POST /api/v1/orders              — create order
   GET  /api/v1/orders              — order history (paginated)
   GET  /api/v1/orders/:orderNumber — order detail
   POST /api/v1/orders/:orderNumber/cancel — cancel (only PENDING/PAID/PROCESSING)
5. Build order cancellation service:
   - Validate status allows cancellation
   - Restore stock_quantity for each order item
   - Update status + record history
6. Build status transition validator:
   - Valid transitions: pending→paid, paid→processing, processing→shipped, shipped→delivered
   - Cancellable from: pending, paid, processing only
7. Build operations routes:
   GET /api/v1/operations/orders                        — all orders, filterable by status/date
   GET /api/v1/operations/orders/:orderNumber           — full order detail
   PUT /api/v1/operations/orders/:orderNumber/status   — update status with note
8. Build admin orders routes:
   GET /api/v1/admin/orders         — all orders (filterable, paginated)
   GET /api/v1/admin/orders/:number — full order detail
9. Implement auditLog middleware on status update endpoints
10. Implement generateOrderNumber utility (ORD-2024-00001 format, sequential)

Key rules:
- order_items must snapshot product name + variant info at order time (products can change later)
- Stock must be decremented atomically at order creation (use Sequelize transaction)
- Operations can only move status forward (cannot go backward)
- Admin can view all orders but not update status (that's Operations only)
```

### Deliverables
```
□ addresses, orders, order_items, order_status_history models
□ Address CRUD (user-scoped)
□ Order creation with full business logic (transaction)
□ Stock snapshot + decrement on order
□ Order number generation
□ Customer order history + detail endpoints
□ Order cancellation with stock restore
□ Status transition validator
□ Operations order endpoints
□ Admin order endpoints
□ Audit logging on status changes
```

---

## SESSION 11 — Orders Frontend (Customer)

**Goal:** Checkout page, order confirmation, order history, and profile page all working.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI, React Query.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–10 complete: Full cart + orders backend working.

TASK — Orders Frontend (Customer):

1. Create src/api/orders.api.js — create(), list(), getByNumber(), cancel()
2. Create src/api/addresses.api.js — list(), create(), update(), remove(), setDefault()
3. Build CheckoutPage.jsx:
   - Step 1: Address selector
     - List existing addresses with select + default badge
     - "Add new address" inline form
     - Selected address highlighted
   - Step 2: Order summary
     - Line items from cart (image, name, variant, qty, price)
     - Coupon input (pre-filled if already applied in cart)
     - Price summary (subtotal, discount, shipping, tax, total)
   - "Place Order" button:
     - Calls POST /orders
     - On success: receives order_number + Razorpay initiation data
     - Stores in component state for payment step (Phase 13)
     - For now: redirect to /orders/:orderNumber (skip payment in this session)
4. Build OrderConfirmationPage.jsx:
   - Order placed successfully message
   - Order number display
   - Summary of items ordered
   - Estimated delivery info
   - "Continue Shopping" + "View Order" buttons
5. Build OrdersPage.jsx:
   - Paginated list of past orders
   - Each order: order number, date, status badge, total, item count
   - Filter by status (tabs)
   - Click → OrderDetailPage
6. Build OrderDetailPage.jsx (customer):
   - Order header (number, date, status badge)
   - OrderTimeline component (visual status history)
   - Delivery address display
   - Order items list (product image, name, variant, qty, unit price, line total)
   - Price summary (subtotal, discount, shipping, tax, total)
   - Cancel button (shown only if status is pending/paid/processing)
   - Cancel confirmation dialog
7. Build ProfilePage.jsx:
   - Account info section (name, email, phone — edit inline)
   - Addresses section:
     - AddressCard list with edit/delete/set-default actions
     - AddressForm (add/edit modal)
8. Build OrderTimeline.jsx:
   - Visual stepper showing all order statuses in sequence
   - Completed steps highlighted, current step active, future steps greyed
   - Shows note + timestamp per completed step
9. Build AddressCard.jsx and AddressForm.jsx (reused in checkout + profile)

Key rules:
- Checkout only accessible if authenticated (AuthGuard)
- If cart is empty, redirect from checkout to /cart
- Order detail accessible by order number (but server scopes to user)
- Cancel confirmation dialog required before API call
```

### Deliverables
```
□ orders.api.js + addresses.api.js
□ CheckoutPage with address selector + order summary
□ Order placed → redirect to confirmation
□ OrderConfirmationPage
□ OrdersPage with status tabs + pagination
□ OrderDetailPage with timeline + cancel
□ ProfilePage with address management
□ OrderTimeline component
□ AddressCard + AddressForm (reusable)
□ Cancel confirmation dialog
```

---

## SESSION 12 — Payments Backend

**Goal:** Razorpay fully integrated with server-side webhook verification.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, MySQL (Sequelize), Razorpay SDK.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Sessions 01–11 complete: Auth + Catalog + Cart + Orders all working.

TASK — Payments Backend:

1. Create Sequelize migration and model:
   - payments (order_id, gateway, gateway_order_id, gateway_payment_id, gateway_signature, amount, currency, status, payment_method, failure_reason, refund_amount, raw_webhook_payload JSON)
2. Build src/modules/payments/gateways/gateway.interface.js:
   Interface with methods: initiatePayment(order), verifyPayment(payload), processRefund(paymentId, amount), handleWebhook(payload, signature)
3. Build src/modules/payments/gateways/razorpay.gateway.js — implements interface:
   - initiatePayment: create Razorpay order, return { razorpay_order_id, amount, currency, key_id }
   - verifyPayment: HMAC-SHA256 signature check (razorpay_order_id + "|" + razorpay_payment_id)
   - processRefund: call Razorpay refund API
   - handleWebhook: verify X-Razorpay-Signature header
4. Build src/modules/payments/gateways/gateway.factory.js:
   - Reads active_gateway from configurations table
   - Returns correct gateway instance
   - Default: razorpay
5. Build payment routes:
   POST /api/v1/payments/verify        — verify payment after Razorpay success (customer)
   POST /api/v1/payments/webhook/razorpay — webhook from Razorpay (NO auth, raw body)
   GET  /api/v1/orders/:number/payment — payment status for order (customer)
   POST /api/v1/admin/payments/:id/refund — initiate refund (admin)
6. Order creation flow update (from Session 10):
   - POST /orders now calls gateway.initiatePayment() after creating order
   - Returns Razorpay order details alongside order data
7. Webhook handler:
   - Must use express.raw() parser (NOT json) for raw body signature verification
   - Verify X-Razorpay-Signature header before processing
   - On payment.captured event: update order status PENDING → PAID, create payment record
   - On payment.failed: update payment record, keep order as PENDING (customer can retry)
   - Store raw_webhook_payload for debugging
8. Payment verify endpoint (frontend calls this after Razorpay success modal closes):
   - Re-verify signature server-side
   - Update order + payment record
   - Return updated order status
9. Idempotency: webhook may fire multiple times — check if payment already recorded before processing

Key rules:
- NEVER trust frontend payment status — always verify server-side
- Webhook endpoint must NOT have JWT auth middleware (it comes from Razorpay, not user)
- Webhook endpoint must use express.raw() not express.json() for correct signature verification
- Razorpay credentials read from configurations table (encrypted) via ConfigService
```

### Deliverables
```
□ payments migration + model
□ PaymentGateway interface
□ RazorpayGateway implementation (initiate + verify + webhook + refund)
□ GatewayFactory (config-driven)
□ Payment verify endpoint
□ Webhook handler with signature verification
□ Order creation returns Razorpay order data
□ Order status updated to PAID on webhook
□ Idempotency check on webhook
□ Admin refund endpoint
□ Payment status endpoint
```

---

## SESSION 13 — Payments Frontend

**Goal:** Razorpay checkout modal integrated. Full purchase flow end-to-end.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Razorpay checkout.js.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–12 complete: Full backend including payments working.

TASK — Payments Frontend:

1. Create src/api/payments.api.js — verify(), getPaymentStatus()
2. Update CheckoutPage.jsx — complete the payment flow:
   a. "Place Order" calls POST /api/v1/orders
   b. Receives: { order_number, payment_initiation: { razorpay_order_id, amount, currency, key_id } }
   c. Load Razorpay checkout.js via script tag (add to index.html or dynamic load)
   d. Open Razorpay modal with:
      - key: key_id from response
      - amount, currency, order_id: razorpay_order_id
      - name: site name from ConfigContext
      - prefill: customer name + email + phone
      - theme.color: primary_color from ConfigContext
   e. On Razorpay success callback:
      - Call POST /api/v1/payments/verify with razorpay_order_id, razorpay_payment_id, razorpay_signature
      - On verify success: redirect to /orders/:order_number?success=true
      - On verify failure: show error, allow retry
   f. On Razorpay modal dismiss/failure:
      - Show error message
      - "Retry Payment" button (opens modal again with same razorpay_order_id)
      - "Cancel Order" button
3. Update OrderConfirmationPage.jsx:
   - Show payment success message
   - Show order details
4. Update OrderDetailPage.jsx:
   - Show payment status badge
   - If order is PENDING and payment not initiated: show "Complete Payment" button
5. Handle edge case: user closes browser after order created but before paying
   - On OrderDetailPage: if status=pending, show "Complete Payment" button
   - Button should re-initiate payment for the existing order

End-to-end test:
- Add product to cart → checkout → fill address → place order → Razorpay modal opens
- Complete test payment → verify called → order status PAID → redirect to confirmation
- Verify webhook also fires and updates status independently
```

### Deliverables
```
□ payments.api.js
□ Razorpay checkout.js loaded
□ CheckoutPage opens Razorpay modal with correct data
□ Payment success → verify API → redirect to confirmation
□ Payment failure → error message + retry
□ Retry payment on existing pending order
□ OrderDetailPage shows payment status
□ Full purchase flow tested end-to-end
```

---

## SESSION 14 — Admin Portal: Products & Catalog

**Goal:** Admin can create, edit, and manage products, categories, and attributes from the UI.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI, React Query.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–13 complete: Full customer-facing flow complete.

TASK — Admin Portal: Products & Catalog:

1. Build AdminLayout.jsx (full layout):
   - AdminSidebar with grouped nav links (Products, Catalog, Orders, Users, Discounts, Config, CMS)
   - AdminHeader with page title + user info + logout
   - Responsive: sidebar collapses on mobile
2. Build Admin DashboardPage.jsx:
   - StatsCard grid: Total Orders Today, Revenue This Month, Total Products, Low Stock Alerts, Pending Reviews
   - Stats fetched from GET /api/v1/admin/dashboard (build this endpoint too)
3. Create src/api/admin/products.api.js, src/api/admin/categories.api.js, src/api/admin/attributes.api.js
4. Build DataTable.jsx (reusable):
   - Columns config prop
   - Pagination
   - Search input
   - Row actions (edit, delete, toggle status)
   - Loading + empty states
5. Build ProductsListPage.jsx:
   - DataTable with: image, name, SKU, category, price range, stock, status
   - Search + filter by category/status
   - Create + Edit buttons
6. Build ProductCreatePage.jsx (and ProductEditPage.jsx reuses same form):
   Section 1 — Basic Info:
     - Name, slug (auto-generated, editable), brand, short description, description (rich text or textarea)
     - Is Active, Is Featured toggles
   Section 2 — Categories:
     - Multi-select category tree (checkboxes in tree structure)
     - Primary category selector
   Section 3 — Images:
     - Drag & drop multi-image uploader
     - Set primary image
     - Delete images
     - Preview grid
   Section 4 — Attributes:
     - Select which attributes apply to this product
   Section 5 — Variants:
     - VariantManager component:
       - Shows all combinations based on selected attributes + values
       - Admin enters: SKU, price, compare_price, cost_price, stock_quantity, low_stock_threshold per variant
       - Can deactivate specific combinations
   Section 6 — Offer:
     - Toggle to enable product-level offer
     - OfferForm: type, value, dates, min_order_value, buy/get quantities
   Section 7 — SEO:
     - Meta title, meta description
7. Build CategoriesPage.jsx:
   - Tree view of all categories
   - Add/edit/delete inline or modal
   - Drag to reorder (optional)
8. Build AttributesPage.jsx:
   - List of attributes with their values
   - Create/edit attribute (name, type, is_filterable, is_visible)
   - Add/edit/delete attribute values inline
   - Color hex picker for color values

Key rules:
- Product form must auto-generate slug from name (editable)
- VariantManager must regenerate variant rows when attributes change
- Image upload uses multipart/form-data
- Edit page pre-fills all fields including existing variants + images
```

### Deliverables
```
□ AdminLayout with sidebar + header
□ DashboardPage with stats
□ DataTable reusable component
□ ProductsListPage
□ ProductCreatePage (full 7-section form)
□ ProductEditPage (pre-filled)
□ VariantManager component
□ Image drag-and-drop uploader
□ CategoriesPage (tree view + CRUD)
□ AttributesPage (list + values manager)
```

---

## SESSION 15 — Admin Portal: Config & CMS

**Goal:** Admin can configure all platform settings and CMS content from the UI.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–14 complete: Admin product management working.

Also ensure these backend endpoints are built if not already:
  GET/PUT /api/v1/admin/config/:group
  GET/PATCH /api/v1/admin/feature-flags/:key
  GET/PUT/POST /api/v1/admin/cms/:key
  GET /api/v1/config/public
  GET /api/v1/cms/:section

TASK — Admin Portal: Config & CMS:

1. Create src/api/admin/config.api.js — getGroup(), updateGroup(), getFeatureFlags(), toggleFlag()
2. Create src/api/admin/cms.api.js — getAll(), getBySection(), update(), create()
3. Create src/api/config.api.js (public) — getPublic()
4. Build ConfigForm.jsx (reusable form that renders fields from config schema):
   - Supports field types: text, password (masked), number, select, toggle, color picker
   - Save button with loading state
   - Secret fields show "••••••" with toggle to reveal
5. Build GeneralConfigPage.jsx:
   - Site name, tagline, logo upload, favicon upload, contact email/phone, currency
6. Build ThemeConfigPage.jsx:
   - Color pickers for primary, secondary, accent, background, text colors
   - Font family dropdown
   - Live preview panel showing how colors look
7. Build PaymentConfigPage.jsx:
   - Active gateway selector (razorpay / stripe — dropdown)
   - Razorpay section: key_id, key_secret (masked), webhook_secret (masked)
   - Currency selector
8. Build NotificationConfigPage.jsx:
   - SMTP section: host, port, username, password (masked), from_name, from_email
   - "Send Test Email" button
   - SMS section: provider selector, api_key (masked), sender_id
   - "Send Test SMS" button
9. Build ShippingConfigPage.jsx:
   - Active strategy selector
   - Flat rate amount input
   - Shipping rules list (for future strategies)
10. Build TaxConfigPage.jsx:
    - Tax rules DataTable (region, category, rate %)
    - Add/edit/delete tax rule
11. Build FeatureFlagsPage.jsx:
    - List of all feature flags with description + toggle switch
    - Save all button
12. Build CmsHomePage.jsx:
    - Hero section editor (title, body text, image upload, CTA link + text)
    - Promo strip editor (announcement bar text + color)
    - Banner 1 + Banner 2 editors
    - Preview of how each section looks
13. Build CmsContentPage.jsx:
    - Footer text editor
    - Auth page taglines
    - Empty state messages
14. Build EmailTemplatesPage.jsx (under CMS):
    - Dropdown to select template (order_confirmation, order_shipped, etc.)
    - Textarea editor with {{variable}} hints
    - Save button
15. Wire ConfigContext to reload after config save (invalidate React Query cache)
16. Apply theme changes LIVE when ThemeConfigPage saves (update CSS variables immediately)

Key rules:
- Secret fields (passwords, API keys) must be masked by default
- Config save must show success/failure toast
- Theme changes should reflect on the live page immediately after save
- Feature flag changes should take effect without page reload
```

### Deliverables
```
□ All config API services
□ ConfigForm reusable component
□ GeneralConfigPage
□ ThemeConfigPage with live preview
□ PaymentConfigPage
□ NotificationConfigPage with test send
□ ShippingConfigPage
□ TaxConfigPage
□ FeatureFlagsPage
□ CmsHomePage (banners + hero editor)
□ CmsContentPage
□ EmailTemplatesPage
□ Config changes reflect immediately in UI
```

---

## SESSION 16 — Admin Portal: Orders, Users & Discounts

**Goal:** Admin can view orders, manage users, and configure all discount/offer settings.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI, React Query.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–15 complete: Admin config + CMS working.

TASK — Admin Portal: Orders, Users & Discounts:

1. Create src/api/admin/orders.api.js, src/api/admin/users.api.js, src/api/admin/discounts.api.js
2. Build Admin OrdersListPage.jsx:
   - DataTable: order number, date, customer name, status, total, payment status
   - Filter by status, date range
   - Search by order number or customer email
   - Click → Admin OrderDetailPage
3. Build Admin OrderDetailPage.jsx:
   - Full order details (read-only for admin)
   - Customer info + delivery address
   - Order items
   - Payment info + status
   - Status history timeline
   - Refund button (for paid orders — calls admin refund endpoint)
4. Build UsersListPage.jsx:
   - DataTable: name, email, role, auth provider, status, registration date
   - Filter by role + status
   - Actions: Toggle active/inactive, Reset password (for ops users), View details
   - "Create New User" button (for creating Operations users):
     - UserCreateModal: name, email, role selector (admin/operations)
     - Auto-generates password, shows it once (copy to clipboard)
5. Build CouponsPage.jsx:
   - DataTable: code, type, value, usage, expiry, status
   - Create/edit coupon form:
     - Code, description, offer type selector
     - Discount value, min order value, max discount
     - Usage limit, per-user limit
     - Date range picker (starts_at, ends_at)
     - Applicable to: all / specific products / specific categories
   - Activate/deactivate toggle
6. Build GlobalOffersPage.jsx:
   - List of global offers with status badge
   - Create/edit global offer form (same fields as coupon minus code)
   - "Set as Active" button — only one active at a time
   - Precedence selector: global_wins / product_wins / best_deal
   - Active offer highlighted prominently

Key rules:
- Admin cannot update order statuses (that's Operations only)
- Admin can view refund status and initiate refunds
- Creating an Operations user must auto-generate a secure random password
- Show generated password ONCE in a modal with "Copy to Clipboard" — never shown again
- Only one global offer can be active at a time (activating one deactivates others)
```

### Deliverables
```
□ Admin OrdersListPage (filterable DataTable)
□ Admin OrderDetailPage (read-only + refund)
□ UsersListPage (all roles, with create ops user)
□ User create modal with auto-generated password
□ CouponsPage (CRUD + all discount types)
□ GlobalOffersPage (CRUD + activate one)
□ Offer precedence configuration
```

---

## SESSION 17 — Operations Portal

**Goal:** Operations team has a focused, efficient order processing dashboard.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: React + Vite, Tailwind + Shadcn/UI, React Query.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Frontend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend
Sessions 01–16 complete: Full admin portal working.

TASK — Operations Portal:

1. Build OperationsLayout.jsx:
   - Clean minimal sidebar (just order status filters + logout)
   - Header with unread/pending order count badge
2. Build OrdersDashboardPage.jsx (operations):
   - Status filter tabs: All | Paid | Processing | Shipped (with count per tab)
   - Orders listed as cards or table rows
   - Each row: order number, time received, customer name, item count, total, current status
   - Sort by: newest first, oldest first
   - Search by order number
   - Click → OrderProcessingPage
   - Auto-refresh order count every 60 seconds (polling)
3. Build OrderProcessingPage.jsx:
   - Left panel: full order details
     - Customer name + phone + email
     - Delivery address (formatted)
     - Order items: product image, name, variant info, quantity, price
     - Price summary
   - Right panel: action panel
     - OrderStatusStepper: visual stepper (Paid → Processing → Shipped → Delivered)
     - Current status highlighted
     - Next status button (e.g. if Processing → "Mark as Shipped")
     - Notes textarea (required for Shipped status — tracking info)
     - Status history log (all past changes with user + timestamp + note)
     - Confirm before status update
4. Build OrderStatusStepper.jsx:
   - Shows: Paid → Processing → Shipped → Delivered
   - Completed steps: filled circle + checkmark
   - Current step: highlighted
   - Future steps: greyed out
5. Build OrderActionPanel.jsx:
   - Status update form
   - Validates: notes required for Shipped (to record tracking info)
   - Shows loading state during API call
   - Shows success confirmation after update

Key rules:
- Operations can only move order FORWARD (no going back)
- Operations cannot cancel orders (customer or admin only)
- Operations cannot see payment credentials or config
- Notes field required when marking as Shipped (for tracking number)
- After status update: optimistically update UI and refetch order
```

### Deliverables
```
□ OperationsLayout (minimal, focused)
□ OrdersDashboardPage with status tabs + counts
□ Auto-refresh order count (60s polling)
□ OrderProcessingPage (details + action panel)
□ OrderStatusStepper visual component
□ OrderActionPanel with notes
□ Status update with confirmation
□ Status history log
```

---

## SESSION 18 — Notifications

**Goal:** Email and SMS notifications fire on all key order events.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, Nodemailer (SMTP).
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Backend is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Sessions 01–17 complete: Full platform working except notifications.

TASK — Notifications:

1. Build src/modules/notifications/email/email.provider.js — interface: send(to, subject, html)
2. Build src/modules/notifications/email/smtp.provider.js — implements interface using Nodemailer:
   - Reads SMTP config from ConfigService (configurations table, group: smtp)
   - Creates transporter on demand (or caches it, invalidates when config changes)
3. Build src/modules/notifications/sms/sms.provider.js — interface only (no concrete impl yet):
   - send(to, message) — log to console if no provider configured
4. Build src/modules/notifications/template.renderer.js:
   - loadTemplate(key) — fetches from cms_content table by key
   - render(template, variables) — replaces {{variable}} placeholders with values
   - Available variables per event (document these clearly)
5. Build src/modules/notifications/notifications.service.js:
   - sendOrderConfirmation(order, user) — email + SMS
   - sendOrderStatusUpdate(order, user, newStatus) — email + SMS
   - sendPasswordReset(user, resetToken) — email only
   - sendWelcomeEmail(user) — email only
   - All methods check feature flags (email_notifications_enabled, sms_notifications_enabled)
   - All sends logged to notification_logs table (success or failure)
6. Integrate notifications into existing services:
   - orders.service.js createOrder() → call sendOrderConfirmation after order created
   - orders.service.js (status update in operations) → call sendOrderStatusUpdate
   - auth.service.js forgotPassword() → call sendPasswordReset
   - auth.service.js register() → call sendWelcomeEmail
7. Build admin test endpoints:
   POST /api/v1/admin/notifications/test-email — send test email to admin's email
   POST /api/v1/admin/notifications/test-sms   — log test SMS (no real provider yet)
8. Default email templates in DB seed:
   - order_confirmation: subject + HTML body with all order variables
   - order_paid: status update template
   - order_processing: status update template
   - order_shipped: template with tracking note variable
   - order_delivered: delivery confirmation template
   - password_reset: reset link template
   - welcome: welcome email template

Key rules:
- Notification failures must NOT break the order flow — catch errors, log them, continue
- Templates fetched from DB (configurable from Admin CMS)
- Feature flags checked before sending — if disabled, skip silently
- SMTP config must be read from DB (not hardcoded in env) to support Admin configuration
```

### Deliverables
```
□ EmailProvider interface + SMTPProvider
□ SMSProvider interface (console stub)
□ TemplateRenderer ({{variable}} replacement)
□ NotificationsService (all 4 methods)
□ Integrated into order creation + status update + auth flows
□ Notification failure does NOT break order flow
□ notification_logs records all attempts
□ Default email templates seeded in DB
□ Admin test-send endpoints
```

---

## SESSION 19 — Reviews & Wishlist (Backend + Frontend)

**Goal:** Product reviews with media support and full wishlist functionality.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js (backend) + React (frontend).
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Sessions 01–18 complete. All core features working.

Working directories:
  Backend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
  Frontend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend

TASK — Reviews & Wishlist (Backend + Frontend):

BACKEND:
1. Create migrations + models: reviews, review_media, wishlist_items
2. Build reviews module:
   GET  /api/v1/products/:slug/reviews      — list approved reviews (public), paginated, sorted by rating/date
   POST /api/v1/products/:slug/reviews      — submit review (customer, multipart/form-data for media)
   GET  /api/v1/admin/reviews               — all reviews pending approval (admin)
   PATCH /api/v1/admin/reviews/:id/approve  — approve review (admin)
   DELETE /api/v1/admin/reviews/:id         — delete review (admin)
3. Review business rules:
   - Customer can only review a product they have a DELIVERED order for (verified purchase)
   - One review per customer per product (unique constraint)
   - Reviews start as is_approved=false — must be approved by admin
   - Media: up to 5 files per review, images/videos only
   - Aggregate rating (avg + count) computed on product queries
4. Build wishlist module:
   GET    /api/v1/wishlist           — get wishlist (customer)
   POST   /api/v1/wishlist/:productId — add to wishlist
   DELETE /api/v1/wishlist/:productId — remove from wishlist

FRONTEND:
5. Complete ProductDetailPage reviews tab:
   - ReviewSection: rating summary (avg + distribution bar chart) + review list
   - ReviewCard: reviewer name, date, rating stars, title, body, media thumbnails
   - ReviewForm: only shown if user has delivered order and hasn't reviewed yet
     - Star rating selector, title, body, media upload (up to 5 files)
     - Submit → pending approval message
6. Build Admin review moderation in Admin portal:
   - Add "Reviews" section to admin sidebar
   - ReviewsModerationPage: list of pending reviews, approve/delete actions
7. WishlistPage already built (Session 09) — ensure it's fully wired
8. WishlistButton on ProductCard + ProductDetailPage — wire fully (toggle add/remove)

Key rules:
- Review media stored via StorageService (same as product images)
- Rating aggregate (avg + count) should be cached or computed efficiently
- Wishlist check: when loading ProductDetailPage, check if product is in user wishlist (to show filled heart)
```

### Deliverables
```
□ reviews + review_media + wishlist_items models
□ Review submission endpoint (multipart, media support)
□ Review listing (public, approved only)
□ Verified purchase check before allowing review
□ Admin review moderation endpoints
□ Wishlist CRUD endpoints
□ Reviews tab on ProductDetailPage (rating summary + list + form)
□ ReviewCard component
□ ReviewForm with star selector + media upload
□ Admin ReviewsModerationPage
□ WishlistButton fully wired (toggle + state)
```

---

## SESSION 20 — Security Hardening

**Goal:** All security measures from ARCHITECTURE.md Section 9 applied.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js, React + Vite.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md — read Section 9 carefully.

Sessions 01–19 complete. Full platform working. Now applying security hardening.

Working directories:
  Backend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
  Frontend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend

TASK — Security Hardening:

BACKEND:
1. Install and configure Helmet.js in app.js:
   - Content-Security-Policy (allow Razorpay scripts + frames)
   - HSTS
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
2. Verify all HTML input sanitized with xss library:
   - product descriptions, CMS content body, review text
3. Verify all DB queries use parameterized Sequelize methods (audit all raw queries)
4. Verify CORS config uses allowedOrigins from ALLOWED_ORIGINS env variable
5. Verify all secret fields in configurations table use encrypt/decrypt (crypto.js)
6. Add env.js validation — app must fail to start if:
   - JWT_ACCESS_SECRET shorter than 32 chars
   - ENCRYPTION_KEY not 64 hex chars
   - DB_PASSWORD missing
7. Verify rate limiters applied correctly:
   - /auth/* → 10 req/15min
   - /api/v1/* → 200 req/15min
   - /admin/* → 500 req/15min
8. Verify audit logging middleware applied to all:
   - Admin product create/update/delete
   - Admin user create/update/toggle
   - Admin config updates
   - Operations order status updates
9. File upload security audit:
   - MIME type check (not just extension)
   - File size limits enforced
   - Files served via Nginx (not Express)
   - Upload path not guessable (UUID filenames)
10. Payment security audit:
    - Webhook uses express.raw() (not json)
    - Signature verified before any processing
    - Frontend payment result always re-verified server-side

FRONTEND:
11. Audit all dangerouslySetInnerHTML usage — verify DOMPurify wraps every instance
12. Verify no sensitive data (tokens, keys) stored in localStorage
13. Verify access token only in Zustand memory (not persisted)
14. Add error boundary on all portal layouts

Produce a security audit report listing each item checked and its status.
```

### Deliverables
```
□ Helmet.js with full CSP configured
□ All HTML input sanitized (xss)
□ All DB queries parameterized (audit complete)
□ CORS from env whitelist
□ All secrets encrypted in DB
□ Env startup validation
□ Rate limiters verified
□ Audit logging verified on all sensitive actions
□ File upload security verified
□ Payment security verified
□ Frontend DOMPurify audit
□ No tokens in localStorage
□ Error boundaries on all layouts
□ Security audit report created
```

---

## SESSION 21 — Testing

**Goal:** Critical business logic covered by unit tests. Key flows covered by integration tests.

### Session Prompt
```
You are helping me build a white-label Product Catalog & Ordering Platform.

Tech stack: Node.js + Express.js. Testing: Jest + Supertest.
Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Sessions 01–20 complete. Full platform working and security-hardened.
Backend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend

TASK — Testing:

Install: jest, supertest, @jest/globals

Unit tests — write tests for:
1. src/modules/discounts/offer.engine.js:
   - Product offer only (no global)
   - Global offer only (no product offer)
   - Both offers: global_wins precedence
   - Both offers: product_wins precedence
   - Both offers: best_deal (global better)
   - Both offers: best_deal (product better)
   - Expired offer ignored
   - Inactive offer ignored
2. src/modules/discounts/coupon.service.js:
   - Valid coupon applies correctly
   - Expired coupon rejected
   - Usage limit exceeded rejected
   - Per-user limit exceeded rejected
   - Min order value not met rejected
   - Percentage calculation correct
   - Flat amount calculation correct
3. src/utils/jwt.js:
   - Access token signed + verified
   - Expired token rejected
   - Wrong secret rejected
4. src/modules/payments/gateways/razorpay.gateway.js:
   - verifyPayment: valid signature passes
   - verifyPayment: invalid signature rejected
5. src/modules/orders/orders.service.js (order creation):
   - Out of stock item blocks order
   - Stock correctly decremented on order creation
   - Coupon usage recorded on order creation
   - Cart cleared after order creation

Integration tests (using Supertest + test DB):
6. Auth flow: register → login → refresh → logout
7. Checkout flow: add to cart → create order → verify payment mock
8. Order status transitions: valid transitions pass, invalid blocked

Configure Jest, create test database setup/teardown helpers.
All tests must pass before deployment.
```

### Deliverables
```
□ Jest configured
□ OfferEngine unit tests (all 6 scenarios)
□ CouponService unit tests (all 6 scenarios)
□ JWT utility tests
□ Payment signature verification tests
□ Order creation service tests
□ Auth integration test
□ Checkout flow integration test
□ Order status transition integration test
□ All tests passing
```

---

## SESSION 22 — EC2 Deployment

**Goal:** Platform live on EC2 with Nginx, PM2, SSL, and production database.

### Session Prompt
```
You are helping me deploy a Node.js + React platform to an EC2 instance.

Architecture document is at: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md

Sessions 01–21 complete. Platform fully built and tested.
Backend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend
Frontend: /Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend

Target: AWS EC2 (Ubuntu 22.04)
Domain: [TO BE PROVIDED]

TASK — EC2 Deployment:

1. EC2 server setup checklist:
   - Install Node.js 20 LTS (via nvm)
   - Install MySQL 8.0 (secure installation)
   - Install Redis
   - Install Nginx
   - Install PM2 globally
   - Install Certbot (Let's Encrypt SSL)
   - Create dedicated MySQL user + database for the app
   - Create /var/www/product-catalog directory
   - Create /var/uploads directory with correct permissions
2. Build React frontend:
   - Set VITE_API_URL to production domain
   - npm run build
   - Copy dist/ to /var/www/product-catalog/
3. Deploy Express backend:
   - Copy backend/ to /var/www/product-catalog/backend
   - Create .env with production values
   - npm install --production
   - Run all Sequelize migrations
   - Run all seeders (roles, admin user, default config)
4. Configure Nginx:
   - Serve React build at /
   - Proxy /api/* to Express on port 5000
   - Serve /uploads/ as static files (Nginx, not Express)
   - SPA fallback: all unknown routes → index.html
   - Gzip compression
   - Security headers (HSTS, X-Frame-Options, CSP)
5. Setup SSL with Certbot (Let's Encrypt)
6. Start Express with PM2:
   - Use ecosystem.config.js
   - pm2 start ecosystem.config.js --env production
   - pm2 save
   - pm2 startup (auto-restart on reboot)
7. Configure log rotation (pm2 logrotate)
8. Production smoke test checklist:
   - Homepage loads
   - Admin login works
   - Create a test product — appears in catalog
   - Add to cart + checkout + Razorpay test payment
   - Order appears in Operations dashboard
   - Email notification received
   - Config page saves SMTP settings
   - Theme change applies to frontend

Provide exact shell commands for each step.
```

### Deliverables
```
□ EC2 dependencies installed
□ MySQL production database created
□ Redis running
□ Backend deployed + PM2 running
□ All migrations run on production DB
□ Seed data applied
□ React build deployed
□ Nginx configured (SPA + API proxy + static files)
□ SSL certificate installed
□ PM2 startup configured
□ Log rotation configured
□ All smoke tests passing
□ Production URL accessible
```

---

## Key Decisions Reference

> Quick reference for prompts — always consistent across sessions

| Decision | Value |
|---|---|
| Backend path | `/Users/naveennallanti/Desktop/PROJECTS/product_order_website/backend` |
| Frontend path | `/Users/naveennallanti/Desktop/PROJECTS/product_order_website/frontend` |
| Architecture doc | `/Users/naveennallanti/Desktop/PROJECTS/product_order_website/ARCHITECTURE.md` |
| Backend framework | Express.js |
| ORM | Sequelize |
| Auth | Passport.js + JWT (access in memory, refresh in HTTP-only cookie) |
| Default payment | Razorpay (pluggable) |
| Cache | Redis (ioredis) |
| Shipping | Flat rate (pluggable strategy pattern) |
| Discount logic | One offer per product, no stacking |
| Offer precedence | Configurable (global_wins / product_wins / best_deal) |
| File storage | Local disk (abstracted for S3 later) |
| Email | Nodemailer SMTP (credentials from DB config) |
| Frontend state | React Query (server) + Zustand (client) |
| UI | Tailwind CSS + Shadcn/UI |
| API format | `/api/v1/*` · Standard envelope: `{ success, data, error }` |
| Order number format | `ORD-YYYY-XXXXX` |
| JWT access expiry | 15 minutes |
| JWT refresh expiry | 7 days |

---

## Notes Log

> Record important decisions or deviations here as development progresses

| Date | Session | Note |
|---|---|---|
| 2026-03-16 | — | Architecture design completed across Steps 1–10 |
| 2026-03-16 | S01 | Backend project setup complete. All deps installed, folder structure created, env/db/redis/utils/middleware/migrations/seeders all in place. Server starts clean. |
| 2026-03-16 | S02 | Frontend project setup complete. 91 source files. Vite + React + Tailwind v3 + Shadcn/UI. All stores, guards, layouts, 38 placeholder pages, full router wired. Production build passes (321KB JS, 9.1KB CSS). Note: downgraded Tailwind to v3 for Shadcn/UI compatibility. |
