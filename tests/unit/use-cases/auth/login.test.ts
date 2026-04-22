import { describe, it, expect, mock } from "bun:test";
import { LoginUseCase } from "../../../../src/server/core/use-cases/auth/login";
import { IUserRepository } from "../../../../src/server/core/repositories/user.repository";
import { ITokenRepository } from "../../../../src/server/core/repositories/token.repository";
import { UserEntity } from "../../../../src/server/core/entities/user.entity";
import { AppError } from "../../../../src/server/core/errors";
import bcrypt from "bcryptjs";

const passwordHash = await bcrypt.hash("password123", 12);
const mockUser = new UserEntity(
  "1",
  "sumiran@example.com",
  "Sumiran",
  passwordHash,
  new Date(),
);

const mockUserRepository: IUserRepository = {
  findById: mock(async () => null),
  findByEmail: mock(async () => mockUser),
  create: mock(async () => mockUser),
};

const mockTokenRepository: ITokenRepository = {
  save: mock(async () => {}),
  find: mock(async () => null),
  delete: mock(async () => {}),
  deleteAllForUser: mock(async () => {}),
};

describe("LoginUseCase", () => {
  it("should return tokens on valid credentials", async () => {
    const useCase = new LoginUseCase(mockUserRepository, mockTokenRepository);
    const result = await useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.email).toBe("sumiran@example.com");
  });

  it("should throw INVALID_CREDENTIALS on wrong password", async () => {
    const useCase = new LoginUseCase(mockUserRepository, mockTokenRepository);

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(AppError);
  });

  it("should throw INVALID_CREDENTIALS if user not found", async () => {
    const userRepo = {
      ...mockUserRepository,
      findByEmail: mock(async () => null),
    };
    const useCase = new LoginUseCase(userRepo, mockTokenRepository);

    expect(
      useCase.execute({ email: "noone@example.com", password: "password123" }),
    ).rejects.toThrow(AppError);
  });
});
