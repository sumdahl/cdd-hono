import { eq } from "drizzle-orm";
import { DB } from "../db";
import { countAll } from "../db/pagination";
import { withDbError } from "../db/with-db-error";
import { users } from "./schema/user.schema";
import { IUserRepository } from "../../core/repositories/user.repository";
import { UserEntity } from "../../core/entities/user.entity";
import { AppError, ErrorCode } from "../../core/errors";

const PG_UNIQUE_VIOLATION = "23505";

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<UserEntity | null> {
    return withDbError("find user by id", async () => {
      const [row] = await this.db.select().from(users).where(eq(users.id, id));
      if (!row) return null;
      return new UserEntity(
        row.id,
        row.email,
        row.name,
        row.passwordHash,
        row.isVerified,
        row.createdAt,
      );
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return withDbError("find user by email", async () => {
      const [row] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email));
      if (!row) return null;
      return new UserEntity(
        row.id,
        row.email,
        row.name,
        row.passwordHash,
        row.isVerified,
        row.createdAt,
      );
    });
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    return withDbError(
      "create user",
      async () => {
        const [row] = await this.db
          .insert(users)
          .values({ id: crypto.randomUUID(), ...data })
          .returning();
        return new UserEntity(
          row.id,
          row.email,
          row.name,
          row.passwordHash,
          row.isVerified,
          row.createdAt,
        );
      },
      (err) => {
        if (err.code === PG_UNIQUE_VIOLATION) {
          return new AppError(
            ErrorCode.EMAIL_TAKEN,
            "Email already in use",
            409,
          );
        }
        return null;
      },
    );
  }

  async markAsVerified(userId: string): Promise<void> {
    return withDbError("verify user", () =>
      this.db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, userId)),
    );
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    return withDbError("update password", () =>
      this.db.update(users).set({ passwordHash }).where(eq(users.id, userId)),
    );
  }

  async findAll(
    options: { limit?: number; offset?: number } = {},
  ): Promise<{ users: UserEntity[]; total: number }> {
    return withDbError("find all users", async () => {
      const { limit = 20, offset = 0 } = options;
      const [rows, countResult] = await Promise.all([
        this.db
          .select()
          .from(users)
          .limit(limit)
          .offset(offset)
          .orderBy(users.createdAt),
        this.db.select({ count: countAll }).from(users),
      ]);
      return {
        users: rows.map(
          (r) =>
            new UserEntity(
              r.id,
              r.email,
              r.name,
              r.passwordHash,
              r.isVerified,
              r.createdAt,
            ),
        ),
        total: countResult[0].count,
      };
    });
  }

  async delete(userId: string): Promise<void> {
    return withDbError("delete user", () =>
      this.db.delete(users).where(eq(users.id, userId)),
    );
  }
}
