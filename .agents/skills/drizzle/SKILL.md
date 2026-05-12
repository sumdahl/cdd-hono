---
name: drizzle
description: Drizzle ORM for PostgreSQL - schema definitions, migrations, queries, and repository patterns. Use when working with database tables, migrations, writing repository layers, or running db:generate/migrate commands.
---

# Drizzle ORM Patterns

## Setup

Your project uses:
- `drizzle-kit` for migrations
- PostgreSQL as the database
- Schema located at `src/server/infrastructure/persistence/schema/`

Commands:
- `npm run db:generate` - Generate migration from schema changes
- `npm run db:migrate` - Run pending migrations
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Drizzle Studio

## Schema Definition

### Basic Table

```typescript
import { pgTable, varchar, text, timestamp, boolean, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  name: varchar("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### Indexes

```typescript
export const users = pgTable(
  "users",
  { /* columns */ },
  (t) => [
    index("users_is_verified_idx").on(t.isVerified),
    index("users_email_idx").on(t.email),
  ]
);
```

### Foreign Keys

```typescript
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // ...
});
```

## Repository Pattern

See [repository-patterns.md](repository-patterns.md) for CRUD operations, pagination, and error handling.

## Common Operations

### Select

```typescript
const [row] = await db.select().from(users).where(eq(users.id, id));
```

### Insert

```typescript
const [row] = await db.insert(users).values({
  id: crypto.randomUUID(),
  email: data.email,
  name: data.name,
  passwordHash: data.passwordHash,
}).returning();
```

### Update

```typescript
await db.update(users).set({ isVerified: true }).where(eq(users.id, userId));
```

### Delete

```typescript
await db.delete(users).where(eq(users.id, userId));
```

### Count

```typescript
const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
```

## Workflow: Adding a New Table

1. Define schema in `src/server/infrastructure/persistence/schema/`
2. Create entity in `src/server/core/entities/`
3. Create interface in `src/server/core/repositories/`
4. Create repository implementation in `src/server/infrastructure/persistence/`
5. Register in DI container
6. Run `npm run db:generate`
7. Run `npm run db:migrate`

See [repository-patterns.md](repository-patterns.md) for full examples.