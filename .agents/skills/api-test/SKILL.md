---
name: api-test
description: Automate API endpoint testing against running dev server. Starts server if needed, runs all endpoints, reports failures, writes bug plans to docs/. Use when testing API endpoints, running smoke tests, or validating API contract compliance.
---

# API Test Automation

## Quick start

```bash
bun run .agents/skills/api-test/scripts/test-api.sh
```

## What it does

1. Check if `bun dev` server running on `http://localhost:8000`
2. Start server in background if not running
3. Verify `/api/v1/health` returns 200
4. Run all authenticated + unauthenticated endpoints
5. Print pass/fail per endpoint
6. Write bug plans to `docs/api-test-findings/`

## Constraints

- Never modify project source code
- If endpoint fails, write concise bug plan to `docs/` — no code changes
- Auth tokens created fresh each run (register + login flow)
- Server state resets per run (no persistent DB)

## Workflow

```
1. Verify server up
2. Create test user via POST /auth/register
3. Extract verification token from response
4. Verify email via GET /auth/verify-email
5. Login via POST /auth/login
6. Use tokens for protected routes (auth, admin)
7. Report results
```

## Test data

- Test user: `apitest-{timestamp}@test.com` / `password123`
- Auth endpoints tested with valid + invalid tokens
- Admin endpoints tested with admin + regular user tokens
