# Implement Permission Loading

## Metadata
- **Priority:** High
- **Status:** Done
- **Dependencies:** `fix-app-context-types.md` must be completed first

## Problem
`loadPermissions` middleware exists at `src/server/infrastructure/http/middleware/load-permissions.middleware.ts` and is correctly implemented — but it is **never applied** in `src/server/index.ts` or any route.

As a result:
- `c.get("permissions")` is always `undefined` at runtime
- `requirePermission()` is permanently broken despite being defined
- The RBAC permission system is non-functional end-to-end

> ⚠️ Note: An earlier version of this task incorrectly suggested modifying `authMiddleware` to inline permission loading and injecting `IRoleRepository` directly into it. That approach is wrong. The correct fix is simply to **wire the existing `loadPermissions` middleware** in the appropriate places. `loadPermissions` is the right pattern — separate concern, applied after auth.

## Current State
`loadPermissions` is defined and correct:
- Reads `roles` from context (set by `authMiddleware`)
- Calls `roleRepository.findAll()` → filters to user's roles → calls `roleRepository.findPermissionsByRoleIds()`
- Sets `permissions` on context

But it is wired **nowhere**. `server/index.ts` never imports or applies it.

## Required Change

### `src/server/index.ts`
Apply `loadPermissions` globally after `authMiddleware` would have run, **or** apply it per-route on every protected route group that uses `requirePermission()`.

**Option A — Global (simpler):**
```typescript
// After authMiddleware runs on protected routes, loadPermissions populates permissions.
// On public routes where authMiddleware doesn't run, loadPermissions short-circuits
// because roles is empty/undefined → sets permissions to [].
app.use("*", loadPermissions);
```

**Option B — Per route group (explicit, lower overhead):**
Apply `loadPermissions` as middleware on the specific route definitions that use `requirePermission()`. Currently no routes use `requirePermission()` — they use `requireRole()` — so this is a prep step for future use.

> **Recommended:** Option A for correctness guarantees. Since `loadPermissions` already short-circuits when `roles` is empty (public routes), the performance overhead is minimal.

## Notes on `IRoleRepository` method
The existing `loadPermissions` middleware correctly uses `findPermissionsByRoleIds(roleIds: string[])` — not `findPermissionsByUserId` (which does not exist on the interface). No new repository methods are needed.

## Acceptance Criteria
- [ ] `loadPermissions` is wired in `server/index.ts` after `requestLogger`
- [ ] `c.get("permissions")` returns a populated array on authenticated requests
- [ ] `requirePermission()` correctly grants or denies access based on loaded permissions
- [ ] Public routes are unaffected (permissions defaults to `[]`)
- [ ] `bun run build` passes
- [ ] `bun test` passes with no regressions
