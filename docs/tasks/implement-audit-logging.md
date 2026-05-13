# Implement Audit Logging

## Metadata
- **Priority:** Medium
- **Status:** Pending
- **Estimated time:** ~2h
- **Dependencies:** None

## Problem

Entity mutations (user create/update/delete, role assignment, etc.) are untracked. No record of who changed what or when. Debugging unauthorized changes requires digging through app logs — no structured audit trail.

## Scope

Track mutations on all 5 mutable entities:
- User (create, update password, mark verified, delete)
- Role (create, delete — via seed/migration, not API yet)
- User-Role assignments (assign, remove)
- Token operations (create refresh token, delete)

Read-only operations (GET, find, verify) excluded.

## Solution: Repository Decorator

Add an `IAuditLogRepository` interface + Postgres implementation. Wrap each Postgres repository with an audit decorator that logs mutations post-write.

### Files to create

| File | Purpose |
|------|---------|
| `core/repositories/audit-log.repository.ts` | `IAuditLogRepository` interface |
| `infrastructure/persistence/schema/audit.schema.ts` | Drizzle `pgTable("audit_logs", ...)` |
| `infrastructure/persistence/audit-log.pg.repository.ts` | `PostgresAuditLogRepository` impl |
| `infrastructure/persistence/audit.decorator.ts` | Decorator HOF wrapping repos |
| `infrastructure/db/migrations/xxxx_add_audit_logs.sql` | Migration |

### Table schema

```
audit_logs
  id          UUID PK
  entity_type TEXT        (e.g. "user", "user_role")
  entity_id   UUID
  action      TEXT        (e.g. "created", "deleted", "role_assigned")
  actor_id    UUID NULL   (userId who made the change, NULL for system)
  metadata    JSONB NULL  (before/after diff, role name, etc.)
  created_at  TIMESTAMPTZ
```

### Implementation pattern

```typescript
// audit.decorator.ts
export function withAudit<T extends object>(
  repo: T,
  auditLogRepo: IAuditLogRepository,
  entityType: string,
): T {
  return new Proxy(repo, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      if (typeof original !== "function") return original;
      const auditableMethods = ["create", "update", "delete", "assignRoleToUser", "removeRoleFromUser"];
      if (!auditableMethods.includes(prop as string)) return original;
      return async (...args: any[]) => {
        const result = await original.apply(target, args);
        await auditLogRepo.log({
          entityType,
          entityId: args[0]?.id ?? args[0] ?? result?.id,
          action: prop as string,
          actorId: args[0]?.actorId ?? null,
          metadata: { args },
        });
        return result;
      };
    },
  });
}
```

### Wire in container.ts

Wrap each `Postgres*Repository` with `withAudit(...)` before registering. The `auditLogRepository` must be registered first.

```typescript
const auditLogRepo = new PostgresAuditLogRepository(db);
container.register({
  auditLogRepository: asValue(auditLogRepo),
  userRepository: asValue(withAudit(new PostgresUserRepository(db), auditLogRepo, "user")),
  // ... same for role repo
});
```

### Test approach

- `InMemoryAuditLogRepository` for existing use-case tests (assert audit trail created)
- Dedicated unit tests for decorator: verify it wraps methods, calls `auditLogRepo.log()` with correct args
- Integration: full flow via in-memory repo + in-memory audit log

## Acceptance Criteria

- [ ] `audit_logs` table created via migration
- [ ] `IAuditLogRepository` in core with `log(entry)` method
- [ ] `PostgresAuditLogRepository` inserts rows
- [ ] Decorator wraps user + role repos for create/delete/assign operations
- [ ] No behavioral change to existing API responses
- [ ] `bun test` passes
