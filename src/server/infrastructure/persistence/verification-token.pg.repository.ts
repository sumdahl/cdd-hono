import { eq } from "drizzle-orm";
import { DB } from "../db";
import { verificationTokens } from "./schema/user.schema";
import { IVerificationTokenRepository } from "../../core/repositories/verification-token.respository";
import { VerificationTokenEntity } from "../../core/entities/verification-token.entity";
import { AppError, ErrorCode } from "../../core/errors";

export class PostgresVerificationTokenRepository implements IVerificationTokenRepository {
  constructor(private readonly db: DB) {}

  async save(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<VerificationTokenEntity> {
    try {
      const [row] = await this.db
        .insert(verificationTokens)
        .values({ id: crypto.randomUUID(), userId, token, expiresAt })
        .returning();
      return new VerificationTokenEntity(
        row.id,
        row.userId,
        row.token,
        row.expiresAt,
        row.createdAt,
      );
    } catch (err) {
      console.error("[DB] save verification token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to save verification token",
        500,
      );
    }
  }

  async find(token: string): Promise<VerificationTokenEntity | null> {
    try {
      const [row] = await this.db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.token, token));
      if (!row) return null;
      return new VerificationTokenEntity(
        row.id,
        row.userId,
        row.token,
        row.expiresAt,
        row.createdAt,
      );
    } catch (err) {
      console.error("[DB] find verification token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to find verification token",
        500,
      );
    }
  }

  async delete(token: string): Promise<void> {
    try {
      await this.db
        .delete(verificationTokens)
        .where(eq(verificationTokens.token, token));
    } catch (err) {
      console.error("[DB] delete verification token failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete verification token",
        500,
      );
    }
  }

  async deleteAllForUser(userId: string): Promise<void> {
    try {
      await this.db
        .delete(verificationTokens)
        .where(eq(verificationTokens.userId, userId));
    } catch (err) {
      console.error("[DB] deleteAllForUser verification tokens failed:", err);
      throw new AppError(
        ErrorCode.DB_ERROR,
        "Failed to delete verification tokens",
        500,
      );
    }
  }
}
