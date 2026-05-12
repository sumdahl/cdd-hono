# Drizzle Repository Patterns

## Standard Repository Structure

```typescript
import { eq, sql, and } from "drizzle-orm";
import { DB from "../db";
import { MyTable } from "./schema/my-table.schema";
import { IMyRepository } from "../../core/repositories/my.repository";
import { MyEntity } from "../../core/entities/my.entity";
import { AppError, ErrorCode } from "../../core/errors";
import { logger } from "../logger";

const PG_UNIQUE_VIOLATION = "23505";

function isDbError(err: unknown): err is { code: string; message: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export class PostgresMyRepository implements IMyRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<MyEntity | null> {
    try {
      const [row] = await this.db
        .select()
        .from(MyTable)
        .where(eq(MyTable.id, id));
      return row ? this.toEntity(row) : null;
    } catch (err) {
      logger.error("[DB] findById failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find record", 500);
    }
  }

  async findByColumn(column: string): Promise<MyEntity | null> {
    try {
      const [row] = await this.db
        .select()
        .from(MyTable)
        .where(eq(MyTable.someColumn, column));
      return row ? this.toEntity(row) : null;
    } catch (err) {
      logger.error("[DB] findByColumn failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find record", 500);
    }
  }

  async create(data: CreateInput): Promise<MyEntity> {
    try {
      const [row] = await this.db
        .insert(MyTable)
        .values({ id: crypto.randomUUID(), ...data })
        .returning();
      return this.toEntity(row);
    } catch (err) {
      logger.error("[DB] create failed:", err);
      if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION) {
        throw new AppError(ErrorCode.ALREADY_EXISTS, "Duplicate entry", 409);
      }
      throw new AppError(ErrorCode.DB_ERROR, "Failed to create record", 500);
    }
  }

  async update(id: string, data: Partial<UpdateInput>): Promise<void> {
    try {
      await this.db
        .update(MyTable)
        .set(data)
        .where(eq(MyTable.id, id));
    } catch (err) {
      logger.error("[DB] update failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to update record", 500);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(MyTable).where(eq(MyTable.id, id));
    } catch (err) {
      logger.error("[DB] delete failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to delete record", 500);
    }
  }

  async findAll(options: { limit?: number; offset?: number } = {}): Promise<{ items: MyEntity[]; total: number }> {
    try {
      const { limit = 20, offset = 0 } = options;
      const [rows, countResult] = await Promise.all([
        this.db
          .select()
          .from(MyTable)
          .limit(limit)
          .offset(offset),
        this.db.select({ count: sql<number>`count(*)::int` }).from(MyTable),
      ]);
      return {
        items: rows.map(this.toEntity),
        total: countResult[0].count,
      };
    } catch (err) {
      logger.error("[DB] findAll failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to fetch records", 500);
    }
  }

  private toEntity(row: typeof MyTable._infer): MyEntity {
    return new MyEntity(/* map fields */);
  }
}
```

## Error Codes

| PostgreSQL Code | Description |
|-----------------|-------------|
| 23505 | Unique violation |
| 23503 | Foreign key violation |
| 23502 | Not null violation |

## Pagination Pattern

```typescript
async findPaginated(page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    db.select().from(table).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(table),
  ]);
  return {
    data,
    pagination: {
      page,
      pageSize,
      total: total[0].count,
      totalPages: Math.ceil(total[0].count / pageSize),
    },
  };
}
```

## Complex Queries

### Where with multiple conditions

```typescript
const results = await db
  .select()
  .from(users)
  .where(and(
    eq(users.isVerified, true),
    gte(users.createdAt, new Date('2024-01-01'))
  ));
```

### Join

```typescript
const result = await db
  .select()
  .from(posts)
  .leftJoin(users, eq(posts.userId, users.id))
  .where(eq(posts.id, postId));
```

## Transactions

```typescript
await this.db.transaction(async (tx) => {
  await tx.insert(table1).values(data1);
  await tx.update(table2).set(data2).where(eq(table2.id, id));
});
```