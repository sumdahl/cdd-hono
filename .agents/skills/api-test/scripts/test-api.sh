#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:8000/api/v1"
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJ_DIR="$(cd "$SKILL_DIR/../../.." && pwd)"
GEN_TOKEN="bun run $SKILL_DIR/scripts/gen-token.ts"
RESET_RL="bun run $SKILL_DIR/scripts/reset-rate-limiter.ts"

PASS=0
FAIL=0
BUG_DIR="docs/api-test-findings"
TIMESTAMP=$(date +%s)
USER_EMAIL="apitest-${TIMESTAMP}@test.com"
USER_PASS="password123"

rm -rf "$BUG_DIR"
mkdir -p "$BUG_DIR"

ok()   { PASS=$((PASS+1)); echo "  PASS  $1"; }
fail() { local f="$BUG_DIR/${1//\//_}.md"; FAIL=$((FAIL+1)); echo "  FAIL  $1"; echo "$2" > "$f"; }
json() { python3 -c "import json,sys; print(json.load(sys.stdin)$1)" 2>/dev/null || echo ""; }
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }

# ---- Phase 1: server up ----
echo "=== Phase 1: Server health ==="
if ! curl -sf "$BASE/health" > /dev/null 2>&1; then
  echo "  starting bun dev..."
  cd "$PROJ_DIR"
  bun dev &
  SERVER_PID=$!
  trap "kill $SERVER_PID 2>/dev/null; exit" EXIT INT TERM
  for i in $(seq 1 30); do
    if curl -sf "$BASE/health" > /dev/null 2>&1; then ok "server started"; break; fi
    sleep 1
  done
  if ! curl -sf "$BASE/health" > /dev/null 2>&1; then fail "server-start" "Did not start in 30s"; exit 1; fi
fi

cd "$PROJ_DIR"
$RESET_RL 2>/dev/null || true

# ---- Phase 2: register + basic auth ----
echo -e "\n=== Phase 2: Auth endpoints ==="
HEALTH=$(curl -sf "$BASE/health")
echo "$HEALTH" | grep -q '"status":"ok"' && ok "/health" || fail "/health" "bad status"

REG=$(curl -sf -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"name\":\"Tester\",\"password\":\"$USER_PASS\"}")
REG_USER_ID=$(echo "$REG" | json "['data']['user']['id']")
echo "$REG" | grep -q '"success":true' && ok "/auth/register" || fail "/auth/register" "$REG"

DUP=$(code -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"name\":\"Tester\",\"password\":\"$USER_PASS\"}")
[ "$DUP" = "409" ] && ok "/auth/register duplicate (409)" || fail "/auth/register duplicate" "got $DUP"

LOGIN_UNV=$(code -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"$USER_PASS\"}")
[ "$LOGIN_UNV" = "403" ] && ok "/auth/login unverified (403)" || fail "/auth/login unverified" "got $LOGIN_UNV"

LOGIN_BAD=$(code -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\",\"password\":\"wrongpass\"}")
[ "$LOGIN_BAD" = "401" ] && ok "/auth/login bad password (401)" || fail "/auth/login bad password" "got $LOGIN_BAD"

sleep 6  # stay under rate limit

# ---- Phase 3: generate tokens ----
echo -e "\n=== Phase 3: Token generation ==="
$RESET_RL 2>/dev/null || true
AUTH_TOKEN=$($GEN_TOKEN access "$REG_USER_ID" "$USER_EMAIL" "user" 2>/dev/null || echo "")
ADMIN_TOKEN=$($GEN_TOKEN access "$REG_USER_ID" "$USER_EMAIL" "admin" 2>/dev/null || echo "")
REFRESH_TOKEN=$($GEN_TOKEN refresh "$REG_USER_ID" "$USER_EMAIL" 2>/dev/null || echo "")
[ -n "$AUTH_TOKEN" ] && [ -n "$ADMIN_TOKEN" ] && ok "tokens generated" || fail "token-gen" "token generation failed"

# ---- Phase 4: authenticated auth endpoints ----
echo -e "\n=== Phase 4: Authenticated auth ==="
ME=$(curl -sf -H "Authorization: Bearer $AUTH_TOKEN" "$BASE/auth/me")
echo "$ME" | grep -q "$REG_USER_ID" && ok "/auth/me" || fail "/auth/me" "$ME"

ME_NO_AUTH=$(code "$BASE/auth/me")
[ "$ME_NO_AUTH" = "401" ] && ok "/auth/me no auth (401)" || fail "/auth/me no auth" "got $ME_NO_AUTH"

# logout first, then refresh with consumed token
LOGOUT=$(code -X POST "$BASE/auth/logout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
[ "$LOGOUT" = "200" ] && ok "/auth/logout" || fail "/auth/logout" "got $LOGOUT"

REF_RESP=$(code -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
[ "$REF_RESP" = "401" ] && ok "/auth/refresh consumed (401)" || fail "/auth/refresh consumed" "got $REF_RESP"

# need a fresh user for resend + forgot (existing email is fine, rate limiter reset above)
RESEND=$(code -X POST "$BASE/auth/resend-verification" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\"}")
[ "$RESEND" = "200" ] && ok "/auth/resend-verification" || fail "/auth/resend-verification" "got $RESEND"

FORGOT=$(code -X POST "$BASE/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$USER_EMAIL\"}")
[ "$FORGOT" = "200" ] && ok "/auth/forgot-password" || fail "/auth/forgot-password" "got $FORGOT"

sleep 6

# ---- Phase 5: admin endpoints ----
echo -e "\n=== Phase 5: Admin endpoints ==="
$RESET_RL 2>/dev/null || true
ADMIN_USERS=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/admin/users")
echo "$ADMIN_USERS" | grep -q '"success":true' && ok "/admin/users" || fail "/admin/users" "$ADMIN_USERS"

ADMIN_USERS_BY_ID=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/admin/users/$REG_USER_ID")
echo "$ADMIN_USERS_BY_ID" | grep -q '"success":true' && ok "/admin/users/:id" || fail "/admin/users/:id" "$ADMIN_USERS_BY_ID"

ADMIN_USERS_404=$(code -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/admin/users/nonexistent")
[ "$ADMIN_USERS_404" = "404" ] && ok "/admin/users/:id not found (404)" || fail "/admin/users/:id not found" "got $ADMIN_USERS_404"

ADMIN_ROLES=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE/admin/roles")
echo "$ADMIN_ROLES" | grep -q '"success":true' && ok "/admin/roles" || fail "/admin/roles" "$ADMIN_ROLES"

ASSIGN_ROLE=$(code -X POST "$BASE/admin/users/$REG_USER_ID/roles" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"role":"moderator"}')
[ "$ASSIGN_ROLE" = "200" ] && ok "/admin/users/:id/roles assign" || fail "/admin/users/:id/roles assign" "got $ASSIGN_ROLE"

REMOVE_ROLE=$(code -X DELETE "$BASE/admin/users/$REG_USER_ID/roles/moderator" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
[ "$REMOVE_ROLE" = "200" ] && ok "/admin/users/:id/roles/:name remove" || fail "/admin/users/:id/roles/:name remove" "got $REMOVE_ROLE"

sleep 6

# ---- Phase 6: validation + edge cases ----
echo -e "\n=== Phase 6: Validation ==="
$RESET_RL 2>/dev/null || true
VAL_REG=$(code -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"","name":"","password":"short"}')
[ "$VAL_REG" = "422" ] && ok "/auth/register validation (422)" || fail "/auth/register validation" "got $VAL_REG"

VAL_LOGIN=$(code -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"bad","password":""}')
[ "$VAL_LOGIN" = "422" ] && ok "/auth/login validation (422)" || fail "/auth/login validation" "got $VAL_LOGIN"

UNAUTH_USERS=$(code "$BASE/admin/users")
[ "$UNAUTH_USERS" = "401" ] && ok "/admin/users no auth (401)" || fail "/admin/users no auth" "got $UNAUTH_USERS"

UNAUTH_ROLES=$(code "$BASE/admin/roles")
[ "$UNAUTH_ROLES" = "401" ] && ok "/admin/roles no auth (401)" || fail "/admin/roles no auth" "got $UNAUTH_ROLES"

NOTFOUND=$(code "$BASE/auth/nonexistent")
[ "$NOTFOUND" = "404" ] && ok "/auth/nonexistent (404)" || fail "/auth/nonexistent" "got $NOTFOUND"

# ---- report ----
echo -e "\n=== Results ==="
echo "PASS=$PASS FAIL=$FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "Bug plans in $BUG_DIR/:"
  cat "$BUG_DIR"/*.md
  exit 1
fi
