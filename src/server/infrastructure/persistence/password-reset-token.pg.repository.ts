import { eq } from "drizzle-orm";
import { DB } from "../db";
import { withDbError } from "../db/with-db-error";
import { passwordResetTokens } from "./schema/user.schema";
import { IPasswordResetTokenRepository } from "../../core/repositories/password-reset-token.repository";

export class PostgresPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(private readonly db: DB) {}

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    return withDbError("save password reset token", async () => {
      await this.db.insert(passwordResetTokens).values({
        id: crypto.randomUUID(),
        userId,
        token,
        expiresAt,
      });
    });
  }

  async find(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    return withDbError("find password reset token", async () => {
      const [row] = await this.db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, token));
      if (!row) return null;
      return { userId: row.userId, expiresAt: row.expiresAt };
    });
  }

  async delete(token: string): Promise<void> {
    return withDbError("delete password reset token", async () => {
      await this.db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    return withDbError("delete all password reset tokens for user", async () => {
      await this.db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    });
  }
}
