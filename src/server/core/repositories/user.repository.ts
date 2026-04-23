import { UserEntity } from "../entities/user.entity";

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: {
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserEntity>;
  markAsVerified(userId: string): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
