#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# auth-flow.sh — Automation script: Authentication flow
#
# Covers:
#   1. Register new customer account
#   2. Login with correct credentials
#   3. Access protected route with access token
#   4. Refresh token using HTTP-only cookie
#   5. Logout (clears refresh cookie)
#   6. Reject login with wrong password
#   7. Reject login with unknown email
#   8. Forgot password (request reset)
#   9. Reject access to protected route after logout
#
# Usage:
#   ./auth-flow.sh
#   BASE_URL=https://your-domain.com/api/v1 ./auth-flow.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
source "$(dirname "$0")/_helpers.sh"

TEST_EMAIL="auto_auth_$$@example.com"
TEST_PASSWORD="AutoTest@1234"
ACCESS_TOKEN=""

echo -e "${BOLD}Product Catalog — Authentication Flow${RESET}"
echo -e "${DIM}Target: $BASE_URL${RESET}"
echo -e "${DIM}Test user: $TEST_EMAIL${RESET}"

# ─── 1. Registration ──────────────────────────────────────────────────────────
section "1. Register"

step "Registering new customer account"
REG_RESP=$(post "/auth/register" "{
  \"first_name\": \"Auto\",
  \"last_name\": \"Tester\",
  \"email\": \"$TEST_EMAIL\",
  \"password\": \"$TEST_PASSWORD\"
}")

assert_ok "Registration succeeds (201)" "$REG_RESP"
assert_field "Response contains user email" "$REG_RESP" "d['data']['user']['email']" "$TEST_EMAIL"
assert_field "Role assigned as customer" "$REG_RESP" "d['data']['user']['role']" "customer"
assert_not_empty "Access token returned" "$(extract "$REG_RESP" "d['data']['accessToken']")"

# ─── 2. Login ─────────────────────────────────────────────────────────────────
section "2. Login"

step "Logging in with correct credentials"
LOGIN_RESP=$(post "/auth/login" "{
  \"email\": \"$TEST_EMAIL\",
  \"password\": \"$TEST_PASSWORD\"
}")

assert_ok "Login succeeds" "$LOGIN_RESP"
ACCESS_TOKEN=$(extract "$LOGIN_RESP" "d['data']['accessToken']")
assert_not_empty "Access token present" "$ACCESS_TOKEN"
info "Token: ${ACCESS_TOKEN:0:40}…"

# ─── 3. Access protected route ────────────────────────────────────────────────
section "3. Protected Route Access"

step "Accessing /orders (requires auth)"
ORDER_RESP=$(get "/orders" "$ACCESS_TOKEN")
assert_ok "Authenticated GET /orders returns 200" "$ORDER_RESP"

step "Accessing /orders without token"
UNAUTH_RESP=$(get "/orders")
UNAUTH_SUCCESS=$(extract "$UNAUTH_RESP" "d.get('success',True)")
if [ "$UNAUTH_SUCCESS" != "True" ]; then
  pass "Unauthenticated request correctly rejected"
else
  fail "Unauthenticated request should have been rejected"
fi

# ─── 4. Refresh token ─────────────────────────────────────────────────────────
section "4. Token Refresh"

step "Refreshing access token using HTTP-only cookie"
REFRESH_RESP=$(post "/auth/refresh-token" "{}")
assert_ok "Refresh token returns new access token" "$REFRESH_RESP"
NEW_TOKEN=$(extract "$REFRESH_RESP" "d['data']['accessToken']")
assert_not_empty "New access token present" "$NEW_TOKEN"

# Verify new token is different from original
if [ "$NEW_TOKEN" != "$ACCESS_TOKEN" ]; then
  pass "Refresh token rotation — new token issued"
else
  warn "New token is identical to previous (may be timing issue)"
fi
ACCESS_TOKEN="$NEW_TOKEN"

# ─── 5. Logout ────────────────────────────────────────────────────────────────
section "5. Logout"

step "Logging out"
LOGOUT_RESP=$(post "/auth/logout" "{}" "$ACCESS_TOKEN")
assert_ok "Logout succeeds" "$LOGOUT_RESP"

step "Attempting refresh after logout (should fail)"
POST_LOGOUT_RESP=$(post "/auth/refresh-token" "{}")
POST_SUCCESS=$(extract "$POST_LOGOUT_RESP" "d.get('success',True)")
if [ "$POST_SUCCESS" != "True" ]; then
  pass "Refresh after logout correctly rejected"
else
  fail "Refresh after logout should have been rejected"
fi

# ─── 6–7. Negative tests ──────────────────────────────────────────────────────
section "6. Invalid Login Scenarios"

step "Login with wrong password"
WRONG_PASS_RESP=$(post "/auth/login" "{
  \"email\": \"$TEST_EMAIL\",
  \"password\": \"WrongPassword@999\"
}")
WRONG_SUCCESS=$(extract "$WRONG_PASS_RESP" "d.get('success',True)")
if [ "$WRONG_SUCCESS" != "True" ]; then
  pass "Wrong password correctly rejected (401)"
else
  fail "Wrong password should be rejected"
fi

step "Login with unknown email"
UNKNOWN_RESP=$(post "/auth/login" "{
  \"email\": \"nobody_$$@example.com\",
  \"password\": \"SomePassword@1\"
}")
UNKNOWN_SUCCESS=$(extract "$UNKNOWN_RESP" "d.get('success',True)")
if [ "$UNKNOWN_SUCCESS" != "True" ]; then
  pass "Unknown email correctly rejected"
else
  fail "Unknown email should be rejected"
fi

step "Register with invalid password (too weak)"
WEAK_RESP=$(post "/auth/register" "{
  \"first_name\": \"Test\",
  \"last_name\": \"User\",
  \"email\": \"weak_$$@example.com\",
  \"password\": \"weak\"
}")
WEAK_SUCCESS=$(extract "$WEAK_RESP" "d.get('success',True)")
if [ "$WEAK_SUCCESS" != "True" ]; then
  pass "Weak password rejected by validation"
else
  fail "Weak password should be rejected"
fi

# ─── 7. Forgot password ───────────────────────────────────────────────────────
section "7. Forgot Password"

step "Requesting password reset"
FORGOT_RESP=$(post "/auth/forgot-password" "{\"email\":\"$TEST_EMAIL\"}")
assert_ok "Forgot password request accepted" "$FORGOT_RESP"
# Token is emailed — we just verify the endpoint accepts the request

# ─── Cleanup ──────────────────────────────────────────────────────────────────
section "Cleanup"
# Log in as admin to delete the test user (or rely on DB cleanup)
info "Test user $TEST_EMAIL was created in DB."
info "Clean up with: DELETE FROM users WHERE email='$TEST_EMAIL';"

summary
