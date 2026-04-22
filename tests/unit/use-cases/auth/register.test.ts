import { describe, it, expect, mock, beforeEach } from "bun:test";
import { RegisterUseCase } from "../../../../src/server/core/use-cases/auth/register";
import { IUserRepository } from "../../../../src/server/core/repositories/user.repository";
import { UserEntity } from "../../../../src/server/core/entities/user.entity";
import { AppError, ErrorCode } from "../../../../src/server/core/errors";

const mockUser = new UserEntity(
  "1",
  "sumiran@example.com",
  "Sumiran",
  "hashedpassword",
  new Date(),
);

const mockRepository: IUserRepository = {
  findById: mock(async () => null),
  findByEmail: mock(async () => null),
  create: mock(async () => mockUser),
  saveRefreshToken: mock(async () => {}),
  findRefreshToken: mock(async () => null),
  deleteRefreshToken: mock(async () => {}),
  deleteAllRefreshTokens: mock(async () => {}),
};

describe("RegisterUseCase", () => {
  it("should register a new user", async () => {
    const useCase = new RegisterUseCase(mockRepository);
    const result = await useCase.execute({
      email: "sumiran@example.com",
      name: "Sumiran",
      password: "password123",
    });

    expect(result.email).toBe("sumiran@example.com");
    expect(result.name).toBe("Sumiran");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("should throw EMAIL_TAKEN if email already exists", async () => {
    const repo = {
      ...mockRepository,
      findByEmail: mock(async () => mockUser),
    };
    const useCase = new RegisterUseCase(repo);

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        name: "Sumiran",
        password: "password123",
      }),
    ).rejects.toThrow(AppError);
  });
});
