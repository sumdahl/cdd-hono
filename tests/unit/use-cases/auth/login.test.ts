import { describe, it, expect, mock } from "bun:test";
import { LoginUseCase } from "../../../../src/server/core/use-cases/auth/login";
import { IUserRepository } from "../../../../src/server/core/repositories/user.repository";
import { UserEntity } from "../../../../src/server/core/entities/user.entity";
import { AppError, ErrorCode } from "../../../../src/server/core/errors";
import bcrypt from "bcryptjs";

const passwordHash = await bcrypt.hash("password123", 12);
const mockUser = new UserEntity(
  "1",
  "sumiran@example.com",
  "Sumiran",
  passwordHash,
  new Date(),
);

const mockRepository: IUserRepository = {
  findById: mock(async () => null),
  findByEmail: mock(async () => mockUser),
  create: mock(async () => mockUser),
  saveRefreshToken: mock(async () => {}),
  findRefreshToken: mock(async () => null),
  deleteRefreshToken: mock(async () => {}),
  deleteAllRefreshTokens: mock(async () => {}),
};

describe("LoginUseCase", () => {
  it("should return tokens on valid credentials", async () => {
    const useCase = new LoginUseCase(mockRepository);
    const result = await useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.email).toBe("sumiran@example.com");
  });

  it("should throw INVALID_CREDENTIALS on wrong password", async () => {
    const useCase = new LoginUseCase(mockRepository);

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(AppError);
  });

  it("should throw INVALID_CREDENTIALS if user not found", async () => {
    const repo = { ...mockRepository, findByEmail: mock(async () => null) };
    const useCase = new LoginUseCase(repo);

    expect(
      useCase.execute({ email: "noone@example.com", password: "password123" }),
    ).rejects.toThrow(AppError);
  });
});
