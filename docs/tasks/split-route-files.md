# Split Large Route Files

## Metadata
- **Priority:** Low
- **Status:** Pending
- **Estimated time:** ~45min
- **Dependencies:** None

## Problem

`auth.routes.ts` (389 lines) bundles 9 route definitions + 9 handlers + imports. Adding one route means +40 lines in a monolithic file. Navigation friction: find the right route among 9.

`admin.routes.ts` (279 lines, 6 routes) — borderline, keep as-is for now.

## Solution: Split auth.routes.ts by sub-domain

Auth routes split into 3 files under `infrastructure/http/auth/`:

```
infrastructure/http/auth/
├── index.ts                 ← wiring (keep as-is)
├── auth.schemas.ts          ← shared schemas (keep)
├── auth.routes.ts           ← remove, replaced by:
├── routes/
│   ├── index.ts             ← combine & export all sub-routers
│   ├── register.ts          ← POST /register + GET /verify-email + POST /resend-verification
│   ├── session.ts           ← POST /login + POST /refresh + POST /logout + GET /me
│   └── password.ts          ← POST /forgot-password + POST /reset-password
```

### Each sub-route file

Follow same factory pattern:

```typescript
// routes/register.ts
export function createRegisterRoutes(deps: { registerUseCase: RegisterUseCase; ... }): OpenAPIHono {
  const router = createAppRouter();
  // register route + handler
  // verify-email route + handler
  // resend-verification route + handler
  return router;
}
```

### Typed deps per file

Each sub-route file defines its own dep type (subset of full Cradle), making deps explicit:

```typescript
// routes/register.ts
type RegisterRoutesDeps = Pick<Cradle, 'registerUseCase' | 'verifyEmailUseCase' | 'resendVerificationUseCase'>;
```

### Combine in routes/index.ts

```typescript
export function createAuthRoutes(deps: Cradle): OpenAPIHono {
  const router = createAppRouter();
  router.route("/", createRegisterRoutes(deps));
  router.route("/", createSessionRoutes(deps));
  router.route("/", createPasswordRoutes(deps));
  return router;
}
```

### Update auth/index.ts

Minimal change — `createAuthRoutes` replaces `createAuthRouter`.

## Benefits

- Each file ~130 lines instead of 389
- Add a register-related route in `register.ts` without touching session or password code
- Deps per file are explicit subsets — easier to test in isolation
- Same pattern scales to admin routes later

## Acceptance Criteria

- [ ] `auth.routes.ts` replaced by 3 sub-route files + `routes/index.ts`
- [ ] All 9 auth endpoints work identically
- [ ] `auth/index.ts` wiring updated (trivial — same cradle pattern)
- [ ] Integration tests pass without changes
- [ ] `bun test` passes
