#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# admin-flow.sh — Automation script: Admin portal full flow
#
# Covers:
#   1.  Admin login
#   2.  Dashboard stats
#   3.  Category — create, list, update
#   4.  Attribute — create attribute + add values
#   5.  Product — create, list, get by ID, update
#   6.  Product variant — add variant to product
#   7.  Discount code (coupon) — create, list, verify
#   8.  Global offer — create, list
#   9.  Orders — list with filters
#  10.  Users — list, create operations user, toggle status
#  11.  Config — read config group, update feature flag
#  12.  CMS — read section, update section
#  13.  Reviews — list pending, approve
#  14.  Cleanup — delete test product, category, coupon
#
# Actual API paths (all under /api/v1):
#   Categories:      GET /categories/admin/list  POST /categories/admin  PUT/DELETE /categories/admin/:id
#   Attributes:      /admin/attributes  /admin/attributes/:id/values
#   Products:        /admin/products  /admin/products/:id  /admin/products/:id/variants
#   Discount codes:  /admin/discount-codes  /admin/discount-codes/:id
#   Global offers:   /admin/global-offers  /admin/global-offers/:id
#   Orders:          /admin/orders  /admin/orders/:orderNumber
#   Users:           /admin/users  /admin/users/:id/status
#   Config:          /admin/config/:group  /admin/config/feature-flags/:key
#   CMS:             /admin/cms/:section
#   Reviews:         /admin/reviews  /admin/reviews/:id/approve
#
# Usage:
#   ./admin-flow.sh
#   BASE_URL=https://your-domain.com/api/v1 ./admin-flow.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin@1234}"
TOKEN=""

# IDs created during this run (for cleanup)
CATEGORY_ID=""
ATTRIBUTE_ID=""
PRODUCT_ID=""
VARIANT_ID=""
COUPON_ID=""
OFFER_ID=""
OPS_USER_ID=""
OPS_EMAIL=""

echo -e "${BOLD}Product Catalog — Admin Panel Flow${RESET}"
echo -e "${DIM}Target: $BASE_URL${RESET}"
echo -e "${DIM}Admin: $ADMIN_EMAIL${RESET}"

# ─── 1. Admin login ───────────────────────────────────────────────────────────
section "1. Admin Login"

step "POST /auth/login"
LOGIN_RESP=$(post "/auth/login" "{
  \"email\": \"$ADMIN_EMAIL\",
  \"password\": \"$ADMIN_PASSWORD\"
}")
assert_ok "Admin login succeeds" "$LOGIN_RESP"
TOKEN=$(extract "$LOGIN_RESP" "d['data']['accessToken']")
assert_not_empty "Access token received" "$TOKEN"
info "Token: ${TOKEN:0:40}…"

# ─── 2. Dashboard ─────────────────────────────────────────────────────────────
section "2. Dashboard Stats"

step "GET /admin/dashboard"
DASH_RESP=$(get "/admin/dashboard" "$TOKEN")
assert_ok "Dashboard stats return 200" "$DASH_RESP"
ORDERS_TODAY=$(extract "$DASH_RESP" "d['data'].get('orders_today',0)")
REVENUE=$(extract "$DASH_RESP" "d['data'].get('revenue_this_month',0)")
PRODUCTS=$(extract "$DASH_RESP" "d['data'].get('total_products',0)")
LOW_STOCK=$(extract "$DASH_RESP" "d['data'].get('low_stock_alerts',0)")
PENDING_REVIEWS=$(extract "$DASH_RESP" "d['data'].get('pending_reviews',0)")
info "Orders today: $ORDERS_TODAY | Revenue this month: $REVENUE"
info "Products: $PRODUCTS | Low stock alerts: $LOW_STOCK | Pending reviews: $PENDING_REVIEWS"

# ─── 3. Category ──────────────────────────────────────────────────────────────
section "3. Category Management"

step "GET /categories/admin/list — list all (admin)"
CAT_LIST_RESP=$(get "/categories/admin/list" "$TOKEN")
assert_ok "Category list returns 200" "$CAT_LIST_RESP"
CAT_COUNT=$(extract "$CAT_LIST_RESP" "len(d['data']['categories'])")
info "Existing categories: $CAT_COUNT"

step "POST /categories/admin — create test category"
CREATE_CAT_RESP=$(post "/categories/admin" "{
  \"name\": \"AutoTest Category $$\",
  \"description\": \"Created by admin-flow.sh automation\"
}" "$TOKEN")
assert_ok "Category created" "$CREATE_CAT_RESP"
CATEGORY_ID=$(extract "$CREATE_CAT_RESP" "d['data']['category']['id']")
assert_not_empty "Category ID returned" "$CATEGORY_ID"
info "Created category ID: $CATEGORY_ID"

step "PUT /categories/admin/$CATEGORY_ID — update category"
UPDATE_CAT_RESP=$(put "/categories/admin/$CATEGORY_ID" "{
  \"name\": \"AutoTest Category $$ (updated)\",
  \"description\": \"Updated by automation script\"
}" "$TOKEN")
assert_ok "Category update succeeds" "$UPDATE_CAT_RESP"

# ─── 4. Attribute ─────────────────────────────────────────────────────────────
section "4. Attribute Management"

step "GET /admin/attributes — list all"
ATTR_LIST_RESP=$(get "/admin/attributes" "$TOKEN")
assert_ok "Attribute list returns 200" "$ATTR_LIST_RESP"

step "POST /admin/attributes — create test attribute"
CREATE_ATTR_RESP=$(post "/admin/attributes" "{
  \"name\": \"AutoAttr_$$\",
  \"is_filterable\": true,
  \"is_visible\": true
}" "$TOKEN")
assert_ok "Attribute created" "$CREATE_ATTR_RESP"
ATTRIBUTE_ID=$(extract "$CREATE_ATTR_RESP" "d['data']['attribute']['id']")
assert_not_empty "Attribute ID returned" "$ATTRIBUTE_ID"
info "Created attribute ID: $ATTRIBUTE_ID"

step "POST /admin/attributes/$ATTRIBUTE_ID/values — add value 'AutoRed'"
ADD_VAL_RED=$(post "/admin/attributes/$ATTRIBUTE_ID/values" "{\"value\": \"AutoRed\"}" "$TOKEN")
assert_ok "Attribute value 'AutoRed' added" "$ADD_VAL_RED"

step "POST /admin/attributes/$ATTRIBUTE_ID/values — add value 'AutoBlue'"
ADD_VAL_BLUE=$(post "/admin/attributes/$ATTRIBUTE_ID/values" "{\"value\": \"AutoBlue\"}" "$TOKEN")
assert_ok "Attribute value 'AutoBlue' added" "$ADD_VAL_BLUE"

# ─── 5. Product ───────────────────────────────────────────────────────────────
section "5. Product Management"

step "GET /admin/products — list (page 1)"
PROD_LIST_RESP=$(get "/admin/products?page=1&limit=5" "$TOKEN")
assert_ok "Admin product list returns 200" "$PROD_LIST_RESP"
PROD_TOTAL=$(extract "$PROD_LIST_RESP" "d['data'].get('pagination',{}).get('total',0)")
info "Total products in admin: $PROD_TOTAL"

step "POST /admin/products — create test product"
CREATE_PROD_RESP=$(post "/admin/products" "{
  \"name\": \"AutoTest Product $$\",
  \"description\": \"<p>This is an automation test product. Safe HTML.</p>\",
  \"category_ids\": [$CATEGORY_ID],
  \"is_active\": true,
  \"meta_title\": \"AutoTest Product\",
  \"meta_description\": \"Automation test product description\"
}" "$TOKEN")
assert_ok "Product created" "$CREATE_PROD_RESP"
PRODUCT_ID=$(extract "$CREATE_PROD_RESP" "d['data']['product']['id']")
assert_not_empty "Product ID returned" "$PRODUCT_ID"
info "Created product ID: $PRODUCT_ID"

step "GET /admin/products/$PRODUCT_ID — fetch by ID"
GET_PROD_RESP=$(get "/admin/products/$PRODUCT_ID" "$TOKEN")
assert_ok "Product detail returns 200" "$GET_PROD_RESP"

step "PUT /admin/products/$PRODUCT_ID — update product"
UPDATE_PROD_RESP=$(put "/admin/products/$PRODUCT_ID" "{
  \"description\": \"<p>Updated by automation script.</p>\"
}" "$TOKEN")
assert_ok "Product update succeeds" "$UPDATE_PROD_RESP"

# ─── 6. Product variant ───────────────────────────────────────────────────────
section "6. Variant Management"

step "POST /admin/products/$PRODUCT_ID/variants — add variant"
CREATE_VAR_RESP=$(post "/admin/products/$PRODUCT_ID/variants" "{
  \"sku\": \"AUTO-SKU-$$\",
  \"price\": 999.00,
  \"compare_price\": 1199.00,
  \"stock_quantity\": 100,
  \"low_stock_threshold\": 10,
  \"is_active\": true
}" "$TOKEN")
assert_ok "Variant created" "$CREATE_VAR_RESP"
VARIANT_ID=$(extract "$CREATE_VAR_RESP" "d['data']['variant']['id']")
assert_not_empty "Variant ID returned" "$VARIANT_ID"
info "Created variant ID: $VARIANT_ID"

# ─── 7. Discount code (coupon) ────────────────────────────────────────────────
section "7. Discount Code Management"

COUPON_CODE="AUTOTEST$$"

step "GET /admin/discount-codes — list"
COUPON_LIST_RESP=$(get "/admin/discount-codes" "$TOKEN")
assert_ok "Discount code list returns 200" "$COUPON_LIST_RESP"

step "POST /admin/discount-codes — create 10% coupon"
CREATE_COUPON_RESP=$(post "/admin/discount-codes" "{
  \"code\": \"$COUPON_CODE\",
  \"offer_type\": \"PERCENT\",
  \"discount_value\": 10,
  \"min_order_value\": 100,
  \"max_uses\": 50,
  \"per_user_limit\": 1,
  \"ends_at\": \"2099-12-31T23:59:59Z\",
  \"is_active\": true
}" "$TOKEN")
assert_ok "Discount code created" "$CREATE_COUPON_RESP"
COUPON_ID=$(extract "$CREATE_COUPON_RESP" "d['data']['discount_code']['id']")
assert_not_empty "Coupon ID returned" "$COUPON_ID"
info "Created coupon: $COUPON_CODE (ID: $COUPON_ID)"

step "GET /admin/discount-codes/$COUPON_ID — verify coupon"
GET_COUPON_RESP=$(get "/admin/discount-codes/$COUPON_ID" "$TOKEN")
assert_ok "Discount code detail returns 200" "$GET_COUPON_RESP"
assert_field "Coupon code matches" "$GET_COUPON_RESP" "d['data']['discount_code']['code']" "$COUPON_CODE"

# ─── 8. Global offer ──────────────────────────────────────────────────────────
section "8. Global Offer"

step "GET /admin/global-offers — list"
OFFER_LIST_RESP=$(get "/admin/global-offers" "$TOKEN")
assert_ok "Global offer list returns 200" "$OFFER_LIST_RESP"

step "POST /admin/global-offers — create 5% festive offer"
CREATE_OFFER_RESP=$(post "/admin/global-offers" "{
  \"name\": \"AutoTest Festive Offer $$\",
  \"offer_type\": \"PERCENT\",
  \"discount_value\": 5,
  \"is_active\": true,
  \"starts_at\": \"2024-01-01T00:00:00Z\",
  \"ends_at\": \"2099-12-31T23:59:59Z\"
}" "$TOKEN")
assert_ok "Global offer created" "$CREATE_OFFER_RESP"
OFFER_ID=$(extract "$CREATE_OFFER_RESP" "d['data']['global_offer']['id']")
assert_not_empty "Offer ID returned" "$OFFER_ID"
info "Created global offer ID: $OFFER_ID"

# ─── 9. Orders ────────────────────────────────────────────────────────────────
section "9. Order Management"

step "GET /admin/orders — list all orders"
ADMIN_ORDERS_RESP=$(get "/admin/orders" "$TOKEN")
assert_ok "Admin order list returns 200" "$ADMIN_ORDERS_RESP"
ORDER_TOTAL=$(extract "$ADMIN_ORDERS_RESP" "d['data'].get('pagination',{}).get('total',0)")
info "Total orders: $ORDER_TOTAL"

step "GET /admin/orders?status=pending — filter by status"
PENDING_ORDERS_RESP=$(get "/admin/orders?status=pending" "$TOKEN")
assert_ok "Pending orders filter returns 200" "$PENDING_ORDERS_RESP"

step "GET /admin/orders?status=paid — filter paid orders"
PAID_ORDERS_RESP=$(get "/admin/orders?status=paid" "$TOKEN")
assert_ok "Paid orders filter returns 200" "$PAID_ORDERS_RESP"

# ─── 10. User management ──────────────────────────────────────────────────────
section "10. User Management"

step "GET /admin/users — list users"
USERS_RESP=$(get "/admin/users" "$TOKEN")
assert_ok "User list returns 200" "$USERS_RESP"
USER_COUNT=$(extract "$USERS_RESP" "len(d['data']['users'])")
info "Total users: $USER_COUNT"

step "POST /admin/users — create operations user"
OPS_EMAIL="auto_ops_$$@example.com"
CREATE_OPS_RESP=$(post "/admin/users" "{
  \"first_name\": \"Auto\",
  \"last_name\": \"Ops\",
  \"email\": \"$OPS_EMAIL\",
  \"role\": \"operations\"
}" "$TOKEN")
assert_ok "Operations user created" "$CREATE_OPS_RESP"
OPS_USER_ID=$(extract "$CREATE_OPS_RESP" "d['data']['user']['id']")
OPS_GEN_PW=$(extract "$CREATE_OPS_RESP" "d['data']['generated_password']")
assert_not_empty "Ops user ID returned" "$OPS_USER_ID"
assert_not_empty "Generated password returned" "$OPS_GEN_PW"
info "Created ops user ID: $OPS_USER_ID ($OPS_EMAIL) | Password: $OPS_GEN_PW"

step "PATCH /admin/users/$OPS_USER_ID/status — toggle to inactive"
TOGGLE_RESP=$(patch "/admin/users/$OPS_USER_ID/status" "{\"is_active\": false}" "$TOKEN")
assert_ok "User status toggle (inactive) succeeds" "$TOGGLE_RESP"

step "PATCH /admin/users/$OPS_USER_ID/status — toggle back to active"
RETOGGLE_RESP=$(patch "/admin/users/$OPS_USER_ID/status" "{\"is_active\": true}" "$TOKEN")
assert_ok "User re-activation succeeds" "$RETOGGLE_RESP"

# ─── 11. Config ───────────────────────────────────────────────────────────────
section "11. Site Config"

step "GET /admin/config/general — read general settings"
CONFIG_RESP=$(get "/admin/config/general" "$TOKEN")
assert_ok "Config read returns 200" "$CONFIG_RESP"
STORE_NAME=$(extract "$CONFIG_RESP" "d['data'].get('store_name','<not set>')")
info "Store name: $STORE_NAME"

step "GET /admin/config/feature-flags — read feature flags"
FLAGS_RESP=$(get "/admin/config/feature-flags" "$TOKEN")
assert_ok "Feature flags returns 200" "$FLAGS_RESP"

# Toggle reviews_enabled flag and restore
# Flags response is an array: [{key, enabled, ...}, ...]
step "PATCH /admin/config/feature-flags/reviews_enabled — toggle + restore"
FLAG_ORIG=$(extract "$FLAGS_RESP" "next((str(f['enabled']) for f in d['data'] if f['key']=='reviews_enabled'), 'True')")
FLAG_NEW="true"
[ "$FLAG_ORIG" = "True" ] && FLAG_NEW="false"
TOGGLE_FLAG_RESP=$(patch "/admin/config/feature-flags/reviews_enabled" "{\"enabled\": $FLAG_NEW}" "$TOKEN")
assert_ok "Feature flag toggle succeeds" "$TOGGLE_FLAG_RESP"
RESTORE_FLAG_RESP=$(patch "/admin/config/feature-flags/reviews_enabled" "{\"enabled\": $(echo "$FLAG_ORIG" | tr '[:upper:]' '[:lower:]')}" "$TOKEN")
assert_ok "Feature flag restored to original value" "$RESTORE_FLAG_RESP"

# ─── 12. CMS ──────────────────────────────────────────────────────────────────
section "12. CMS"

step "GET /admin/cms/homepage — read homepage content"
CMS_RESP=$(get "/admin/cms/homepage" "$TOKEN")
assert_ok "CMS section read returns 200" "$CMS_RESP"

step "PUT /admin/cms/homepage — update homepage content"
UPDATE_CMS_RESP=$(put "/admin/cms/homepage" "{
  \"banner_title\": \"Automated Test Banner\",
  \"banner_subtitle\": \"Updated by admin-flow.sh\"
}" "$TOKEN")
assert_ok "CMS update succeeds" "$UPDATE_CMS_RESP"

# ─── 13. Review moderation ────────────────────────────────────────────────────
section "13. Review Moderation"

step "GET /admin/reviews — pending reviews"
REVIEWS_RESP=$(get "/admin/reviews" "$TOKEN")
assert_ok "Pending reviews list returns 200" "$REVIEWS_RESP"
PENDING_COUNT=$(extract "$REVIEWS_RESP" "len(d['data']['reviews'])")
info "Pending reviews to moderate: $PENDING_COUNT"

if [ "$PENDING_COUNT" != "0" ]; then
  REVIEW_ID=$(extract "$REVIEWS_RESP" "d['data']['reviews'][0]['id']")
  step "PATCH /admin/reviews/$REVIEW_ID/approve — approve first pending review"
  APPROVE_RESP=$(patch "/admin/reviews/$REVIEW_ID/approve" "{}" "$TOKEN")
  assert_ok "Review approval succeeds" "$APPROVE_RESP"
  info "Approved review ID: $REVIEW_ID"
else
  info "No pending reviews to moderate"
fi

# ─── 14. Cleanup ──────────────────────────────────────────────────────────────
section "Cleanup"

# Helper: soft cleanup — warns on failure but never fails the script
cleanup_delete() {
  local label="$1" url="$2"
  local resp
  resp=$(delete "$url" "$TOKEN")
  local ok
  ok=$(extract "$resp" "d.get('success',False)")
  if [ "$ok" = "True" ]; then
    pass "$label"
  else
    warn "$label (non-critical): $(extract "$resp" "d.get('error',{}).get('message','unknown')")"
  fi
}

step "DELETE /admin/discount-codes/$COUPON_ID"
[ -n "$COUPON_ID" ] && cleanup_delete "Test discount code deleted" "/admin/discount-codes/$COUPON_ID"

step "DELETE /admin/global-offers/$OFFER_ID"
[ -n "$OFFER_ID" ] && cleanup_delete "Test global offer deleted" "/admin/global-offers/$OFFER_ID"

# Admin product DELETE is a soft-delete (deactivates in DB, keeps category links).
# The category therefore cannot be hard-deleted — skip category delete.
step "DELETE /admin/products/$PRODUCT_ID (soft-deactivate)"
[ -n "$PRODUCT_ID" ] && cleanup_delete "Test product deactivated" "/admin/products/$PRODUCT_ID"

info "Category $CATEGORY_ID left in DB (product soft-delete keeps FK link)."
info "Remove with: DELETE FROM product_categories WHERE category_id=$CATEGORY_ID; DELETE FROM categories WHERE id=$CATEGORY_ID;"
info "Ops user $OPS_EMAIL (ID: $OPS_USER_ID) left in DB."
info "Remove with: DELETE FROM users WHERE email='$OPS_EMAIL';"

summary
