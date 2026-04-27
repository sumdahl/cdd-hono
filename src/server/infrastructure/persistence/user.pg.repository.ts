import { logger } from "../logger";
import { eq } from "drizzle-orm";
import { DB } from "../db";
import { users } from "./schema/user.schema";
import { IUserRepository } from "../../core/repositories/user.repository";
import { UserEntity } from "../../core/entities/user.entity";
import { AppError, ErrorCode } from "../../core/errors";

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
        row.isVerified,
        row.createdAt,
      );
    } catch (err) {
      logger.error("[DB] findById failed:", err);
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
        row.isVerified,
        row.createdAt,
      );
    } catch (err) {
      logger.error("[DB] findByEmail failed:", err);
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
        row.isVerified,
        row.createdAt,
      );
    } catch (err) {
      logger.error("[DB] create user failed:", err);
      if (isDbError(err) && err.code === PG_UNIQUE_VIOLATION) {
        throw new AppError(ErrorCode.EMAIL_TAKEN, "Email already in use", 409);
      }
      throw new AppError(ErrorCode.DB_ERROR, "Failed to create user", 500);
    }
  }

  async markAsVerified(userId: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({ isVerified: true })
        .where(eq(users.id, userId));
    } catch (err) {
      logger.error("[DB] markAsVerified failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to verify user", 500);
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      await this.db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, userId));
    } catch (err) {
      logger.error("[DB] updatePassword failed:", err);
      throw new AppError(ErrorCode.DB_ERROR, "Failed to update password", 500);
    }
  }

  async findAll(): Promise<UserEntity[]> {
    try {
      const rows = await this.db.select().from(users);
      return rows.map(
        (r) =>
          new UserEntity(
            r.id,
            r.email,
            r.name,
            r.passwordHash,
            r.isVerified,
            r.createdAt,
          ),
      );
    } catch (err) {
      logger.error({ err }, "[DB] findAll users failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to find users", 500);
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.db.delete(users).where(eq(users.id, userId));
    } catch (err) {
      logger.error({ err }, "[DB] delete user failed");
      throw new AppError(ErrorCode.DB_ERROR, "Failed to delete user", 500);
    }
  }
}
