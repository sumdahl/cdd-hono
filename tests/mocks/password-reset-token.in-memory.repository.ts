import { ITokenRepository } from "../../src/server/core/repositories/token.repository";

export class InMemoryPasswordResetTokenRepository implements ITokenRepository {
  private tokens: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  }[] = [];

  async save(userId: string, token: string, expiresAt: Date): Promise<void> {
    this.tokens.push({ id: crypto.randomUUID(), userId, token, expiresAt });
  }

  async find(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    const found = this.tokens.find((t) => t.token === token);
    if (!found) return null;
    return { userId: found.userId, expiresAt: found.expiresAt };
  }

  async delete(token: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.token !== token);
  }

  async deleteAllForUser(userId: string): Promise<void> {
    this.tokens = this.tokens.filter((t) => t.userId !== userId);
  }
}
