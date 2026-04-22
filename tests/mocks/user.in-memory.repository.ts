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
      new Date(),
    );
    this.users.push(user);
    return user;
  }
}
