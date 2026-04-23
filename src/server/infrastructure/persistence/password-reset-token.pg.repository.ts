import { eq } from "drizzle-orm";
import { DB } from "../db";
import { passwordResetTokens } from "./schema/user.schema";
import { ITokenRepository } from "../../core/repositories/token.repository";
import { AppError, ErrorCode } from "../../core/errors";

export class PostgresPasswordResetTokenRepository implements ITokenRepository {
  constructor(private readonly db: DB) {}

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    try {
      await this.db.insert(passwordResetTokens).values({
        id: crypto.randomUUID(),
        userId,
        token,
        expiresAt,
      });
    } catch (err) {
      console.error("[DB] save password reset token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to save password reset token",
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
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
      if (!row) return null;
      return { userId: row.userId, expiresAt: row.expiresAt };
    } catch (err) {
      console.error("[DB] find password reset token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to find password reset token",
        500,
      );
    }
  }

  async delete(token: string): Promise<void> {
    try {
      await this.db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
    } catch (err) {
      console.error("[DB] delete password reset token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete password reset token",
        500,
      );
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await this.db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, userId));
    } catch (err) {
      console.error("[DB] deleteAllForUser password reset tokens failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete password reset tokens",
        500,
      );
    }
  }
}
