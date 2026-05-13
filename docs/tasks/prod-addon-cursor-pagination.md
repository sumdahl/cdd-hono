# Production Add-on: Cursor Pagination

## Metadata
- **Priority:** Low
- **Status:** Pending
- **Estimated time:** ~1h
- **Dependencies:** None

## Problem

`findAll()` uses `LIMIT/OFFSET`. On large tables (100K+ rows), offset grows slow — DB scans past skipped rows. Also inconsistent under write load (new row shifts pages).

## Solution: Cursor-based pagination

### 1. Core types

```typescript
// core/shared/pagination.ts (add to existing)

export type CursorPaginationQuery = {
  cursor?: string;       // opaque cursor (base64-encoded)
  limit: number;         // max 100
};

export type CursorPaginatedResponse<T> = {
  data: T[];
  meta: {
    nextCursor: string | null;  // null = last page
    hasNext: boolean;
  };
};
```

### 2. Encoding/decoding

```typescript
// core/shared/pagination.ts

export function encodeCursor(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

export function decodeCursor(cursor: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(cursor, "base64").toString());
}
```

### 3. Repository method

```typescript
// core/repositories/user.repository.ts (add method)

interface IUserRepository {
  // ... existing methods
  findPage(cursor?: string, limit?: number): Promise<CursorPaginatedResponse<UserEntity>>;
}
```

### 4. Postgres implementation

```typescript
// persistence/user.pg.repository.ts

async findPage(cursor?: string, limit: number = 20): Promise<CursorPaginatedResponse<UserEntity>> {
  return withDbError("find page users", async () => {
    const take = Math.min(limit, 100);
    let query = this.db.select().from(users).orderBy(users.createdAt, users.id).limit(take + 1);

    if (cursor) {
      const decoded = decodeCursor(cursor);
      query = query.where(
        or(
          gt(users.createdAt, new Date(decoded.createdAt as string)),
          and(
            eq(users.createdAt, new Date(decoded.createdAt as string)),
            gt(users.id, decoded.id as string),
          ),
        ),
      );
    }

    const rows = await query;
    const hasNext = rows.length > take;
    if (hasNext) rows.pop();

    const data = rows.map(r => new UserEntity(...));
    const nextCursor = hasNext
      ? encodeCursor({ createdAt: rows[rows.length - 1].createdAt.toISOString(), id: rows[rows.length - 1].id })
      : null;

    return { data, meta: { nextCursor, hasNext } };
  });
}
```

Cursor is composite `(createdAt, id)` — handles ties where multiple rows share same timestamp.

### 5. Route + schema

```typescript
// shared/pagination.ts (add)
export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export function cursorPaginatedResponseSchema<T extends z.ZodTypeAny>(schema: T) {
  return z.object({
    data: z.array(schema),
    meta: z.object({ nextCursor: z.string().nullable(), hasNext: z.boolean() }),
  });
}
```

### 6. Keep offset pagination

Don't remove `findAll`/offset pagination. Offer both:

- **Offset:** Admin UI (needs page navigation, total count)
- **Cursor:** API clients (infinite scroll, feed)

### Test approach

- In-memory repo: implement `findPage` by sorting in-memory array, applying cursor filter
- Test: first page returns `limit` items + `nextCursor`
- Test: second page with cursor returns next `limit` items
- Test: last page returns `nextCursor: null`, `hasNext: false`
- Test: `limit` capped at 100

## Acceptance Criteria

- [ ] `CursorPaginationQuery` + `CursorPaginatedResponse<T>` types in core/shared
- [ ] `encodeCursor`/`decodeCursor` helpers
- [ ] `findPage` on `IUserRepository` (and in-memory impl)
- [ ] `PostgresUserRepository.findPage` with composite cursor
- [ ] `GET /admin/users?cursor=...&limit=20` works
- [ ] Offset `findAll` unchanged (admin UI still works)
- [ ] `bun test` passes
