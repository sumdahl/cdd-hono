import { eq } from "drizzle-orm";
import { DB } from "../db";
import { users, refreshTokens } from "./schema/user.schema";
import { IUserRepository } from "../../core/repositories/user.repository";
import { UserEntity } from "../../core/entities/user.entity";
import { AppError } from "../../core/errors";
import { ErrorCode } from "../../core/errors";

const PG_UNIQUE_VIOLATION = "23505";

function isDbError(err: unknown): err is { code: string; message: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: DB) {}

  async findById(id: string): Promise<UserEntity | null> {
    try {
      const [row] = await this.db.select().from(users).where(eq(users.id, id));
      if (!row) return null;
      return new UserEntity(
        row.id,
        row.email,
        row.name,
        row.passwordHash,
        row.createdAt,
      );
    } catch (err) {
      console.error("[DB] findById failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find user", 500);
    }
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    try {
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
        row.createdAt,
      );
    } catch (err) {
      console.error("[DB] findByEmail failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find user", 500);
    }
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    try {
      const [row] = await this.db
        .insert(users)
        .values({ id: crypto.randomUUID(), ...data })
        .returning();
      return new UserEntity(
        row.id,
        row.email,
        row.name,
        row.passwordHash,
        row.createdAt,
      );
    } catch (err) {
      console.error("[DB] create user failed:", err);
      if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION) {
        throw new AppError(ErrorCode.EMAIL_TAKEN, "Email already in use", 409);
      }
      throw new AppError(ErrorCode.DB_ERROR, "Failed to create user", 500);
    }
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await this.db.insert(refreshTokens).values({
        id: crypto.randomUUID(),
        userId,
        token,
        expiresAt,
      });
    } catch (err) {
      console.error("[DB] saveRefreshToken failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to save refresh token",
        500,
      );
    }
  }

  async findRefreshToken(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    try {
      const [row] = await this.db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token));
      if (!row) return null;
      return { userId: row.userId, expiresAt: row.expiresAt };
    } catch (err) {
      console.error("[DB] findRefreshToken failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to find refresh token",
        500,
      );
    }
  }

  async deleteRefreshToken(token: string): Promise<void> {
    try {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    } catch (err) {
      console.error("[DB] deleteRefreshToken failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete refresh token",
        500,
      );
    }
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    try {
      await this.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId));
    } catch (err) {
      console.error("[DB] deleteAllRefreshTokens failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete refresh tokens",
        500,
      );
    }
  }
}
