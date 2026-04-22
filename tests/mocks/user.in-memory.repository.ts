import { IUserRepository } from "../../src/server/core/repositories/user.repository";
import { UserEntity } from "../../src/server/core/entities/user.entity";

export class InMemoryUserRepository implements IUserRepository {
  private users: UserEntity[] = [];
  private refreshTokens: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  }[] = [];

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const user = new UserEntity(
      crypto.randomUUID(),
      data.email,
      data.name,
      data.passwordHash,
      new Date(),
    );
    this.users.push(user);
    return user;
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    this.refreshTokens.push({
      id: crypto.randomUUID(),
      userId,
      token,
      expiresAt,
    });
  }

  async findRefreshToken(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null> {
    const found = this.refreshTokens.find((t) => t.token === token);
    if (!found) return null;
    return { userId: found.userId, expiresAt: found.expiresAt };
  }

  async deleteRefreshToken(token: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
  }

  async deleteAllRefreshTokens(userId: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.filter((t) => t.userId !== userId);
  }
}
