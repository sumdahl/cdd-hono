import { eq } from "drizzle-orm";
import { DB } from "../db";
import { withDbError } from "../db/with-db-error";
import { verificationTokens } from "./schema/user.schema";
import { IVerificationTokenRepository } from "../../core/repositories/verification-token.repository";
import { VerificationTokenEntity } from "../../core/entities/verification-token.entity";

export class PostgresVerificationTokenRepository implements IVerificationTokenRepository {
  constructor(private readonly db: DB) {}

  async save(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<VerificationTokenEntity> {
    return withDbError("save verification token", async () => {
      const [row] = await this.db
        .insert(verificationTokens)
        .values({ id: crypto.randomUUID(), userId, token, expiresAt })
        .returning();
      return new VerificationTokenEntity(row.id, row.userId, row.token, row.expiresAt, row.createdAt);
    });
  }

  async find(token: string): Promise<VerificationTokenEntity | null> {
    return withDbError("find verification token", async () => {
      const [row] = await this.db
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.token, token));
      if (!row) return null;
      return new VerificationTokenEntity(row.id, row.userId, row.token, row.expiresAt, row.createdAt);
    });
  }

  async delete(token: string): Promise<void> {
    return withDbError("delete verification token", () =>
      this.db.delete(verificationTokens).where(eq(verificationTokens.token, token)),
    );
  }

  async deleteAllForUser(userId: string): Promise<void> {
    return withDbError("delete all verification tokens for user", () =>
      this.db.delete(verificationTokens).where(eq(verificationTokens.userId, userId)),
    );
  }
}
