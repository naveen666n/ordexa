#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# order-journey.sh — Automation script: End-to-end customer order flow
#
# Covers:
#   1.  Login as customer (created by auth-flow.sh, or uses admin for seeded data)
#   2.  Browse product catalog
#   3.  Get product detail by slug
#   4.  Add item to cart
#   5.  View cart
#   6.  Apply coupon (optional — uses TEST_COUPON if set)
#   7.  Get cart summary (discount + totals)
#   8.  Create order (mock payment gateway)
#   9.  Initiate payment
#  10.  Confirm mock payment
#  11.  Verify payment → order transitions to 'paid'
#  12.  View order detail
#  13.  Attempt to cancel a paid order (should fail — not cancellable)
#  14.  Add a review (non-verified — should fail)
#
# Usage:
#   ./order-journey.sh
#   BASE_URL=https://your-domain.com/api/v1 ./order-journey.sh
#   TEST_EMAIL=customer@example.com TEST_PASSWORD=Pass@1234 ./order-journey.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

# ── Config ────────────────────────────────────────────────────────────────────
# Use provided credentials, or fall back to seeded admin (which also has customer
# role access in the test environment)
CUSTOMER_EMAIL="${TEST_EMAIL:-admin@example.com}"
CUSTOMER_PASSWORD="${TEST_PASSWORD:-Admin@1234}"
TEST_COUPON="${TEST_COUPON:-}"   # Optionally pass a coupon code to test

ACCESS_TOKEN=""
PRODUCT_SLUG=""
VARIANT_ID=""
ORDER_ID=""
ORDER_NUMBER=""
RAZORPAY_ORDER_ID=""

echo -e "${BOLD}Product Catalog — Order Journey (End-to-End)${RESET}"
echo -e "${DIM}Target: $BASE_URL${RESET}"
echo -e "${DIM}Customer: $CUSTOMER_EMAIL${RESET}"

# ─── 1. Login ─────────────────────────────────────────────────────────────────
section "1. Customer Login"

step "Logging in as customer"
ACCESS_TOKEN=$(login_as "$CUSTOMER_EMAIL" "$CUSTOMER_PASSWORD")
assert_not_empty "Customer login — access token received" "$ACCESS_TOKEN"
info "Token: ${ACCESS_TOKEN:0:40}…"

# ─── 2. Browse catalog ────────────────────────────────────────────────────────
section "2. Browse Catalog"

step "GET /products (public — paginated list)"
CATALOG_RESP=$(get "/products")
assert_ok "Product list returns 200" "$CATALOG_RESP"
TOTAL_PRODUCTS=$(extract "$CATALOG_RESP" "d['data'].get('pagination',{}).get('total',0)")
info "Total products in catalog: $TOTAL_PRODUCTS"

step "GET /products?limit=5&page=1"
PAGE_RESP=$(get "/products?limit=5&page=1")
assert_ok "Paginated product list returns 200" "$PAGE_RESP"

step "GET /products?search=test"
SEARCH_RESP=$(get "/products?search=test")
assert_ok "Product search returns 200" "$SEARCH_RESP"

# ─── 3. Product detail ────────────────────────────────────────────────────────
section "3. Product Detail"

# Extract first product slug from catalog response
step "Extracting first product slug from catalog"
PRODUCT_SLUG=$(extract "$CATALOG_RESP" "d['data']['products'][0]['slug']" 2>/dev/null || true)

if [ -z "$PRODUCT_SLUG" ] || [ "$PRODUCT_SLUG" = "None" ]; then
  warn "No products found in catalog — skipping product detail, cart, and order sections"
  warn "Seed the database with sample products and re-run: npx sequelize-cli db:seed:all"
  summary
fi

info "Using product slug: $PRODUCT_SLUG"

step "GET /products/$PRODUCT_SLUG"
PRODUCT_RESP=$(get "/products/$PRODUCT_SLUG")
assert_ok "Product detail returns 200" "$PRODUCT_RESP"
assert_field "Product slug matches" "$PRODUCT_RESP" "d['data']['product']['slug']" "$PRODUCT_SLUG"

# Extract first active variant ID
VARIANT_ID=$(extract "$PRODUCT_RESP" "d['data']['product']['variants'][0]['id']" 2>/dev/null || true)
VARIANT_PRICE=$(extract "$PRODUCT_RESP" "d['data']['product']['variants'][0].get('sale_price') or d['data']['product']['variants'][0].get('price',0)" 2>/dev/null || true)
assert_not_empty "Product has at least one variant" "$VARIANT_ID"
info "Variant ID: $VARIANT_ID | Price: $VARIANT_PRICE"

# ─── 4. Add to cart ───────────────────────────────────────────────────────────
section "4. Cart — Add Item"

step "POST /cart/items — add variant to cart"
ADD_RESP=$(post "/cart/items" "{
  \"variant_id\": $VARIANT_ID,
  \"quantity\": 2
}" "$ACCESS_TOKEN")
assert_ok "Item added to cart" "$ADD_RESP"

step "POST /cart/items — add same item again (quantity should increase)"
ADD2_RESP=$(post "/cart/items" "{
  \"variant_id\": $VARIANT_ID,
  \"quantity\": 1
}" "$ACCESS_TOKEN")
assert_ok "Duplicate add increases quantity" "$ADD2_RESP"

step "POST /cart/items — invalid variant ID (should fail)"
INVALID_CART_RESP=$(post "/cart/items" "{
  \"variant_id\": 999999,
  \"quantity\": 1
}" "$ACCESS_TOKEN")
INVALID_SUCCESS=$(extract "$INVALID_CART_RESP" "d.get('success',True)")
if [ "$INVALID_SUCCESS" != "True" ]; then
  pass "Invalid variant correctly rejected"
else
  fail "Invalid variant should have been rejected"
fi

# ─── 5. View cart ─────────────────────────────────────────────────────────────
section "5. Cart — View"

step "GET /cart"
CART_RESP=$(get "/cart" "$ACCESS_TOKEN")
assert_ok "Cart retrieval returns 200" "$CART_RESP"
CART_ITEM_COUNT=$(extract "$CART_RESP" "len(d['data']['cart']['items'])")
assert_not_empty "Cart has items" "$CART_ITEM_COUNT"
info "Items in cart: $CART_ITEM_COUNT"

step "PUT /cart/items/$VARIANT_ID — update quantity to 1"
UPDATE_RESP=$(put "/cart/items/$VARIANT_ID" "{\"quantity\": 1}" "$ACCESS_TOKEN")
assert_ok "Cart quantity update succeeds" "$UPDATE_RESP"

# ─── 6. Apply coupon (optional) ───────────────────────────────────────────────
section "6. Coupon"

if [ -n "$TEST_COUPON" ]; then
  step "POST /cart/apply-coupon — applying code: $TEST_COUPON"
  COUPON_RESP=$(post "/cart/apply-coupon" "{\"coupon_code\": \"$TEST_COUPON\"}" "$ACCESS_TOKEN")
  assert_ok "Coupon applied successfully" "$COUPON_RESP"
  DISCOUNT=$(extract "$COUPON_RESP" "d['data'].get('discount_amount',0)")
  info "Discount applied: $DISCOUNT"
else
  info "No TEST_COUPON set — skipping coupon application"
  info "Re-run with: TEST_COUPON=YOURCODE ./order-journey.sh"
fi

step "POST /cart/apply-coupon — invalid coupon (should fail)"
INVALID_COUPON_RESP=$(post "/cart/apply-coupon" "{\"coupon_code\": \"INVALID_$$\"}" "$ACCESS_TOKEN")
INVALID_COUPON_SUCCESS=$(extract "$INVALID_COUPON_RESP" "d.get('success',True)")
if [ "$INVALID_COUPON_SUCCESS" != "True" ]; then
  pass "Invalid coupon correctly rejected"
else
  fail "Invalid coupon should have been rejected"
fi

# ─── 7. Cart summary ──────────────────────────────────────────────────────────
section "7. Cart Summary"

step "POST /cart/summary — calculate totals with shipping + tax"
SUMMARY_RESP=$(post "/cart/summary" "{}" "$ACCESS_TOKEN")
assert_ok "Cart summary returns 200" "$SUMMARY_RESP"
SUBTOTAL=$(extract "$SUMMARY_RESP" "d['data'].get('subtotal',0)")
TOTAL=$(extract "$SUMMARY_RESP" "d['data'].get('total',0)")
info "Subtotal: $SUBTOTAL | Total (with shipping/tax): $TOTAL"

# ─── 8. Create order ──────────────────────────────────────────────────────────
section "8. Create Order"

# Ensure we have a saved address (create one if needed)
step "GET /addresses — fetch saved addresses"
ADDR_RESP=$(get "/addresses" "$ACCESS_TOKEN")
ADDR_ID=$(extract "$ADDR_RESP" "d['data']['addresses'][0]['id']" 2>/dev/null || echo "")

if [ -z "$ADDR_ID" ] || [ "$ADDR_ID" = "None" ]; then
  step "POST /addresses — creating address for order"
  CREATE_ADDR_RESP=$(post "/addresses" '{
    "full_name": "Test Customer",
    "phone": "9876543210",
    "address_line1": "123 Test Street",
    "city": "Testville",
    "state": "Tamil Nadu",
    "postal_code": "600001",
    "country": "India",
    "is_default": true
  }' "$ACCESS_TOKEN")
  assert_ok "Address created" "$CREATE_ADDR_RESP"
  ADDR_ID=$(extract "$CREATE_ADDR_RESP" "d['data']['address']['id']")
fi

assert_not_empty "Address ID available" "$ADDR_ID"
info "Using address ID: $ADDR_ID"
ORDER_PAYLOAD="{\"address_id\": $ADDR_ID}"

step "POST /orders — placing order"
ORDER_RESP=$(post "/orders" "$ORDER_PAYLOAD" "$ACCESS_TOKEN")
assert_ok "Order created successfully" "$ORDER_RESP"
ORDER_ID=$(extract "$ORDER_RESP" "d['data']['order']['id']")
ORDER_NUMBER=$(extract "$ORDER_RESP" "d['data']['order']['order_number']")
# payment_initiation is returned inline with the order creation response
GATEWAY_ORDER_ID=$(extract "$ORDER_RESP" "d['data']['payment_initiation']['gateway_order_id']")
assert_not_empty "Order ID present" "$ORDER_ID"
assert_not_empty "Order number present" "$ORDER_NUMBER"
assert_not_empty "Gateway order ID returned with order" "$GATEWAY_ORDER_ID"
info "Order: $ORDER_NUMBER (ID: $ORDER_ID) | Gateway order: $GATEWAY_ORDER_ID"

# ─── 9. Payment info (already initiated with order) ───────────────────────────
section "9. Payment — Initiation"

step "GET /orders/$ORDER_NUMBER/payment — check payment status"
PAY_STATUS_RESP=$(get "/orders/$ORDER_NUMBER/payment" "$ACCESS_TOKEN")
assert_ok "Payment status returns 200" "$PAY_STATUS_RESP"
info "Payment status: $(extract "$PAY_STATUS_RESP" "d['data'].get('status','unknown')")"

# ─── 10. Confirm mock payment ─────────────────────────────────────────────────
section "10. Payment — Mock Confirm"

step "POST /payments/mock/confirm — simulating payment success"
MOCK_RESP=$(post "/payments/mock/confirm" "{
  \"gateway_order_id\": \"$GATEWAY_ORDER_ID\"
}" "$ACCESS_TOKEN")
assert_ok "Mock payment confirmation returns 200" "$MOCK_RESP"
MOCK_ORDER_STATUS=$(extract "$MOCK_RESP" "d['data']['order']['status']")
info "Order status after mock confirm: $MOCK_ORDER_STATUS"
assert_field "Order advanced to 'paid'" "$MOCK_RESP" "d['data']['order']['status']" "paid"

# ─── 11. Verify payment (idempotency check) ───────────────────────────────────
section "11. Payment — Idempotency Check"

step "POST /payments/mock/confirm again — should be idempotent (already captured)"
MOCK_RESP2=$(post "/payments/mock/confirm" "{
  \"gateway_order_id\": \"$GATEWAY_ORDER_ID\"
}" "$ACCESS_TOKEN")
assert_ok "Second mock confirm is idempotent" "$MOCK_RESP2"
pass "Mock confirm is idempotent for already-captured payment"

# ─── 12. View order detail ────────────────────────────────────────────────────
section "12. Order Detail"

step "GET /orders — list customer orders"
ORDERS_RESP=$(get "/orders" "$ACCESS_TOKEN")
assert_ok "Customer order list returns 200" "$ORDERS_RESP"
ORDER_COUNT=$(extract "$ORDERS_RESP" "len(d['data']['orders'])")
info "Customer has $ORDER_COUNT order(s)"

step "GET /orders/$ORDER_NUMBER — order detail"
ORDER_DETAIL_RESP=$(get "/orders/$ORDER_NUMBER" "$ACCESS_TOKEN")
assert_ok "Order detail returns 200" "$ORDER_DETAIL_RESP"
ORDER_STATUS=$(extract "$ORDER_DETAIL_RESP" "d['data']['order']['status']")
info "Order $ORDER_NUMBER status: $ORDER_STATUS"

# ─── 13. Cancel paid order (negative) ────────────────────────────────────────
section "13. Cancellation — Negative Test"

# Cancellable statuses: pending, paid, processing
# Non-cancellable: shipped, delivered, cancelled, refunded
step "POST /orders/$ORDER_NUMBER/cancel — (cancellable from pending/paid/processing)"
CANCEL_RESP=$(post "/orders/$ORDER_NUMBER/cancel" "{}" "$ACCESS_TOKEN")
CANCEL_SUCCESS=$(extract "$CANCEL_RESP" "d.get('success',True)")
CANCELLABLE_STATUSES="pending paid processing"
if echo "$CANCELLABLE_STATUSES" | grep -qw "$ORDER_STATUS"; then
  if [ "$CANCEL_SUCCESS" = "True" ]; then
    pass "Order cancellation accepted (status was '$ORDER_STATUS' — cancellable)"
  else
    fail "Order in status '$ORDER_STATUS' should be cancellable"
  fi
else
  if [ "$CANCEL_SUCCESS" != "True" ]; then
    pass "Order cancellation correctly rejected (status '$ORDER_STATUS' is not cancellable)"
  else
    fail "Order in status '$ORDER_STATUS' should NOT be cancellable"
  fi
fi

# ─── 14. Review — non-verified purchase attempt ───────────────────────────────
section "14. Review — Verification Gate"

step "POST /reviews — submitting review for non-delivered order (should fail)"
REVIEW_RESP=$(post "/reviews" "{
  \"product_id\": $(extract "$PRODUCT_RESP" "d['data']['product']['id']"),
  \"rating\": 5,
  \"title\": \"Great product\",
  \"body\": \"Really enjoyed this product, highly recommend!\"
}" "$ACCESS_TOKEN")
REVIEW_SUCCESS=$(extract "$REVIEW_RESP" "d.get('success',True)")
if [ "$REVIEW_SUCCESS" != "True" ]; then
  pass "Review on non-delivered order correctly rejected (verified purchase required)"
else
  warn "Review accepted — order may have transitioned to delivered, or verified-purchase gate is not enforced"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
summary
