import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserEntity>;
  saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void>;
  findRefreshToken(
    token: string,
  ): Promise<{ userId: string; expiresAt: Date } | null>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteAllRefreshTokens(userId: string): Promise<void>;
}
