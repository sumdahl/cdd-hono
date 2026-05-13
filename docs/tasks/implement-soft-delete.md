# Implement Soft Delete

## Metadata
- **Priority:** Low
- **Status:** Pending
- **Estimated time:** ~1.5h
- **Dependencies:** None (independent of audit logging)

## Problem

`DELETE /admin/users/:userId` hard-deletes rows. No recovery path. Accidental deletion means data loss. Cascade behavior (deleting a user should logically expire their tokens) is manual.

## Scope

Soft-delete only the `users` table. Role/Permission tables are reference data — use soft-delete there when a delete API is introduced.

## Implementation

### 1. Schema migration

Add `deletedAt` column to `users` table:

```sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
```

Update Drizzle schema:

```typescript
// persistence/schema/user.schema.ts
export const users = pgTable("users", {
  // ... existing columns
  deletedAt: timestamp("deleted_at"),
});
```

### 2. Update UserEntity

```typescript
// core/entities/user.entity.ts
export class UserEntity {
  constructor(
    // ... existing params
    public readonly deletedAt: Date | null,
  ) {}
}
```

### 3. Update IUserRepository

Add filter parameter:

```typescript
interface IUserRepository {
  findById(id: string, includeDeleted?: boolean): Promise<UserEntity | null>;
  findAll(options?: { limit?: number; offset?: number; includeDeleted?: boolean }): Promise<...>;
}
```

Default `includeDeleted = false` — existing callers unchanged.

### 4. Update PostgresUserRepository

```typescript
// In withDbError block, add WHERE deleted_at IS NULL when not includeDeleted.
eq(users.deletedAt, null) // for non-includeDeleted queries
```

Change `delete()` to `update({ deletedAt: new Date() })` instead of `db.delete()`.

### 5. Update InMemoryUserRepository (test)

Same pattern — filter out soft-deleted by default, return them when `includeDeleted`.

### 6. Update DeleteUserUseCase

Already checks for self-deletion — no change needed. The repository `delete()` becomes soft-delete transparently.

### 7. Cascade on user delete

When a user is soft-deleted, their active refresh tokens and verification tokens should logically expire. Two approaches:
- **Simple:** Delete tokens on soft-delete (same as now, but change to soft)
- **Thorough:** Add `userId` filter to all token queries (repos already filter by userId)

Current behavior: `deleteAllForUser` already runs on password reset. For soft-delete, also delete tokens:

```typescript
await this.tokenRepository.deleteAllForUser(userId);
await this.verificationTokenRepository.deleteAllForUser(userId);
await this.passwordResetTokenRepository.deleteAllForUser(userId);
```

## Edge cases

- **Login blocked:** `LoginUseCase.findByEmail` should exclude soft-deleted users (default behavior).
- **Re-register same email:** Soft-deleted user's email is still "taken" in the DB. Uniqueness constraint prevents reuse unless `email` + `deletedAt IS NULL` unique index.
- **Admin view:** Admin GET endpoints should NOT include deleted users (default behavior). Add `?includeDeleted=true` query param when needed.

## Tests

- Verify `delete` sets `deletedAt` (doesn't hard-delete)
- Verify `findById` returns null for soft-deleted without `includeDeleted`
- Verify `findById` returns entity with `deletedAt` when `includeDeleted = true`
- Verify login blocked for soft-deleted user
- Verify re-register same email fails (unique constraint)
- Update integration test: DELETE user returns 200, GET user by ID returns 404 (soft-delete transparent)

## Acceptance Criteria

- [ ] Migration adds `deleted_at` to users table
- [ ] `UserEntity` includes `deletedAt`
- [ ] `IUserRepository.findById/findAll` accept `includeDeleted?` param, default false
- [ ] `PostgresUserRepository.delete()` soft-deletes (sets `deletedAt`, doesn't `DELETE FROM`)
- [ ] In-memory repo matches behavior
- [ ] Login, admin GET, and re-register all exclude soft-deleted by default
- [ ] `bun test` passes
