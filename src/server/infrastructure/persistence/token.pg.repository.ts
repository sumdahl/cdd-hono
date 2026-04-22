import { eq } from "drizzle-orm";
import { DB } from "../db";
import { refreshTokens } from "./schema/user.schema";
import { ITokenRepository } from "../../core/repositories/token.repository";
import { AppError, ErrorCode } from "../../core/errors";

export class PostgresTokenRepository implements ITokenRepository {
  constructor(private readonly db: DB) {}

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await this.db.insert(refreshTokens).values({
        id: crypto.randomUUID(),
        userId,
        token,
        expiresAt,
      });
    } catch (err) {
      console.error("[DB] save token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to save refresh token",
        500,
      );
    }
  }

  async find(
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
      console.error("[DB] find token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to find refresh token",
        500,
      );
    }
  }

  async delete(token: string): Promise<void> {
    try {
      await this.db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    } catch (err) {
      console.error("[DB] delete token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete refresh token",
        500,
      );
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await this.db
        .delete(refreshTokens)
        .where(eq(refreshTokens.userId, userId));
    } catch (err) {
      console.error("[DB] deleteAllForUser failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete refresh tokens",
        500,
      );
    }
  }
}
