import { IUserRepository } from "../../src/server/core/repositories/user.repository";
import { UserEntity } from "../../src/server/core/entities/user.entity";

export class InMemoryUserRepository implements IUserRepository {
  private users: UserEntity[] = [];

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
      false,
      new Date(),
    );
    this.users.push(user);
    return user;
  }

  async markAsVerified(userId: string): Promise<void> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) return;
    const u = this.users[index];
    this.users[index] = new UserEntity(
      u.id,
      u.email,
      u.name,
      u.passwordHash,
      true,
      u.createdAt,
    );
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) return;
    const u = this.users[index];
    this.users[index] = new UserEntity(
      u.id,
      u.email,
      u.name,
      passwordHash,
      u.isVerified,
      u.createdAt,
    );
  }

  async findAll(): Promise<UserEntity[]> {
    return this.users;
  }

  async delete(userId: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== userId);
  }
}
