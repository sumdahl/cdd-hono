# Add Second Business Domain

## Metadata
- **Priority:** High
- **Status:** Pending
- **Estimated time:** ~4-8h (depends on domain complexity)
- **Dependencies:** None (architecture ready, auth domain serves as reference)

## Problem

Auth is the only domain. Architecture patterns are unexercised for:
- Multi-domain composition (shared middleware, cross-cutting auth)
- Entity relationships across domains
- Domain-specific pagination, filtering, caching
- Separate route prefixes and OpenAPI tags

Adding a second domain validates the architecture and provides a template for future domains.

## Domain candidates

Pick one:

| Domain | Complexity | Why |
|--------|-----------|-----|
| **Workspaces/Teams** | Medium | Needs membership, invites, roles - natural extension of auth |
| **Projects** | Medium | CRUD + ownership + collaboration |
| **Posts/Blog** | Low | Simplest — CRUD + author relationship |
| **Billing/Subscriptions** | High | Payment integration, webhooks, plans |

**Recommended: Workspaces** — reuses User/Role auth infra, tests permission system, adds realistic entity relationships (workspace members, invites, roles).

## Implementation pattern (for any domain)

### Step-by-step

```
1. core/entities/              → WorkspaceEntity, WorkspaceMemberEntity
2. core/repositories/          → IWorkspaceRepository, IWorkspaceMemberRepository
3. core/use-cases/workspace/   → One file per operation (create, list, get, update, delete, invite, accept)
4. infrastructure/persistence/ → PostgresWorkspaceRepository + Drizzle schema
5. infrastructure/http/workspace/ → routes.ts + schemas.ts + index.ts
6. infrastructure/di/          → Register in container.ts + Cradle
7. tests/                      → Unit tests (in-memory repos) + integration tests
```

### Reference pattern

Copy the auth domain structure exactly:

```
src/server/
├── core/
│   ├── entities/workspace.entity.ts
│   ├── repositories/workspace.repository.ts    ← IWorkspaceRepository
│   └── use-cases/workspace/                    ← one file per operation
└── infrastructure/
    ├── persistence/
    │   ├── schema/workspace.schema.ts           ← Drizzle pgTable
    │   └── workspace.pg.repository.ts           ← Postgres impl
    └── http/
        └── workspace/
            ├── workspace.routes.ts              ← createWorkspaceRouter(deps, middleware)
            ├── workspace.schemas.ts             ← Zod + OpenAPI schemas
            └── index.ts                         ← wire deps, export router
```

### DI wiring

```typescript
// container.ts
workspaceUseCase: asClass(CreateWorkspaceUseCase).singleton(),
listWorkspacesUseCase: asClass(ListWorkspacesUseCase).singleton(),
// ... etc
```

### test/workspace/ — minimum coverage

- Unit tests per use-case (in-memory repos)
- Integration test for the full HTTP flow (one happy path, one error case)

```typescript
// tests/unit/use-cases/workspace/create-workspace.test.ts
// tests/integration/workspace/workspace.routes.test.ts
```

## Auth integration

Workspace routes need auth middleware:

```typescript
// workspace.routes.ts
router.openapi(createRoute, workspaceMiddleware(authMiddleware), async (c) => {
  const userId = c.get("userId");
  const result = await createWorkspace.execute({ ...input, ownerId: userId });
  return successHandler(c, result, "Workspace created", 201);
});
```

## Acceptance Criteria

- [ ] New domain has at least: entity, repository interface, Postgres impl, 2 use-cases (create + list), routes
- [ ] Following folder structure identical to auth/admin domains
- [ ] Registered in DI container
- [ ] Unit tests for each use-case (in-memory repos)
- [ ] Integration test for HTTP flow
- [ ] OpenAPI spec updated (new endpoints visible in Swagger)
- [ ] `bun test` passes
- [ ] No changes to existing auth/admin code
