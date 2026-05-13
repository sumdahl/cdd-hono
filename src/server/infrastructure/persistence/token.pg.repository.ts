import { eq } from "drizzle-orm";
import { DB } from "../db";
import { withDbError } from "../db/with-db-error";
import { refreshTokens } from "./schema/user.schema";
import { ITokenRepository } from "../../core/repositories/token.repository";

export class PostgresTokenRepository implements ITokenRepository {
  constructor(private readonly db: DB) {}

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    return withDbError("save refresh token", () =>
      this.db.insert(refreshTokens).values({
        id: crypto.randomUUID(),
        userId,
        token,
        expiresAt,
      }),
    );
  }

  async find(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    return withDbError("find refresh token", async () => {
      const [row] = await this.db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, token));
      if (!row) return null;
      return { userId: row.userId, expiresAt: row.expiresAt };
    });
  }

  async delete(token: string): Promise<void> {
    return withDbError("delete refresh token", () =>
      this.db.delete(refreshTokens).where(eq(refreshTokens.token, token)),
    );
  }

  async deleteAllForUser(userId: string): Promise<void> {
    return withDbError("delete all refresh tokens for user", () =>
      this.db.delete(refreshTokens).where(eq(refreshTokens.userId, userId)),
    );
  }
}
