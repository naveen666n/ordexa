#!/usr/bin/env bash
# _helpers.sh — Shared utilities for all automation scripts
# Source this file: source "$(dirname "$0")/_helpers.sh"

# ── Configuration ─────────────────────────────────────────────────────────────
BASE_URL="${BASE_URL:-http://localhost:5000/api/v1}"
COOKIE_JAR="/tmp/product_catalog_cookies_$$.txt"

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── Counters ──────────────────────────────────────────────────────────────────
PASS=0
FAIL=0
SKIP=0

# ── Output helpers ────────────────────────────────────────────────────────────
section()  { echo -e "\n${BOLD}${CYAN}══ $* ══${RESET}"; }
step()     { echo -e "  ${DIM}▶${RESET} $*"; }
pass()     { echo -e "  ${GREEN}✓${RESET} $*"; PASS=$((PASS+1)); }
fail()     { echo -e "  ${RED}✗${RESET} $*"; FAIL=$((FAIL+1)); }
warn()     { echo -e "  ${YELLOW}⚠${RESET} $*"; }
info()     { echo -e "  ${DIM}ℹ $*${RESET}"; }

summary() {
  echo ""
  echo -e "${BOLD}─────────────────────────────────────────${RESET}"
  echo -e "${BOLD} Results: ${GREEN}${PASS} passed${RESET}  ${RED}${FAIL} failed${RESET}"
  echo -e "${BOLD}─────────────────────────────────────────${RESET}"
  [ "$FAIL" -eq 0 ] && echo -e "${GREEN}${BOLD} All checks passed.${RESET}" || echo -e "${RED}${BOLD} Some checks failed — see above.${RESET}"
  rm -f "$COOKIE_JAR"
  [ "$FAIL" -eq 0 ] && exit 0 || exit 1
}

# ── HTTP helpers ──────────────────────────────────────────────────────────────

# POST with JSON body, returns response body
post() {
  local url="$1"
  local body="$2"
  local token="${3:-}"
  local auth_header=""
  [ -n "$token" ] && auth_header="-H \"Authorization: Bearer $token\""

  curl -s -X POST \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -d "$body" \
    "${BASE_URL}${url}"
}

# GET, returns response body
get() {
  local url="$1"
  local token="${2:-}"

  curl -s -X GET \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    "${BASE_URL}${url}"
}

# PUT with JSON body
put() {
  local url="$1"
  local body="$2"
  local token="${3:-}"

  curl -s -X PUT \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -d "$body" \
    "${BASE_URL}${url}"
}

# PATCH with JSON body
patch() {
  local url="$1"
  local body="$2"
  local token="${3:-}"

  curl -s -X PATCH \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -d "$body" \
    "${BASE_URL}${url}"
}

# DELETE
delete() {
  local url="$1"
  local token="${2:-}"

  curl -s -X DELETE \
    -H "Content-Type: application/json" \
    ${token:+-H "Authorization: Bearer $token"} \
    -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    "${BASE_URL}${url}"
}

# ── Assertion helpers ─────────────────────────────────────────────────────────

# assert_status <label> <response_json> <expected_success_bool>
assert_ok() {
  local label="$1"
  local response="$2"
  local success
  success=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(str(d.get('success',False)).lower())" 2>/dev/null)
  if [ "$success" = "true" ]; then
    pass "$label"
    return 0
  else
    local msg
    msg=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error',{}).get('message','unknown error'))" 2>/dev/null)
    fail "$label — $msg"
    return 1
  fi
}

# assert_field <label> <response_json> <jq_path_python> <expected_value>
assert_field() {
  local label="$1"
  local response="$2"
  local path="$3"       # e.g. "d['data']['user']['email']"
  local expected="$4"
  local actual
  actual=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print($path)" 2>/dev/null)
  if [ "$actual" = "$expected" ]; then
    pass "$label"
  else
    fail "$label — expected '$expected', got '$actual'"
  fi
}

# extract <response_json> <python_path>  → prints value
extract() {
  local response="$1"
  local path="$2"
  echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print($path)" 2>/dev/null
}

# assert_not_empty <label> <value>
assert_not_empty() {
  local label="$1"
  local value="$2"
  if [ -n "$value" ] && [ "$value" != "None" ] && [ "$value" != "null" ]; then
    pass "$label"
  else
    fail "$label — value is empty or null"
  fi
}

# assert_http_ok <label> <url> <token>  — quick check that a GET returns success
assert_get_ok() {
  local label="$1"
  local url="$2"
  local token="${3:-}"
  local resp
  resp=$(get "$url" "$token")
  assert_ok "$label" "$resp"
}

# login_as <email> <password> → sets ACCESS_TOKEN, returns it
login_as() {
  local email="$1"
  local password="$2"
  local resp
  resp=$(post "/auth/login" "{\"email\":\"$email\",\"password\":\"$password\"}")
  local token
  token=$(extract "$resp" "d['data']['accessToken']")
  echo "$token"
}
