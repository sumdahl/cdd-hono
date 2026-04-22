import { describe, it, expect, mock } from "bun:test";
import { MeUseCase } from "../../../../src/server/core/use-cases/auth/me";
import { IUserRepository } from "../../../../src/server/core/repositories/user.repository";
import { UserEntity } from "../../../../src/server/core/entities/user.entity";
import { AppError, ErrorCode } from "../../../../src/server/core/errors";

const mockUser = new UserEntity(
  "1",
  "sumiran@example.com",
  "Sumiran",
  "hash",
  new Date(),
);

const mockRepository: IUserRepository = {
  findById: mock(async () => mockUser),
  findByEmail: mock(async () => null),
  create: mock(async () => mockUser),
  saveRefreshToken: mock(async () => {}),
  findRefreshToken: mock(async () => null),
  deleteRefreshToken: mock(async () => {}),
  deleteAllRefreshTokens: mock(async () => {}),
};

describe("MeUseCase", () => {
  it("should return user by id", async () => {
    const useCase = new MeUseCase(mockRepository);
    const result = await useCase.execute("1");

    expect(result.id).toBe("1");
    expect(result.email).toBe("sumiran@example.com");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("should throw USER_NOT_FOUND if user does not exist", async () => {
    const repo = { ...mockRepository, findById: mock(async () => null) };
    const useCase = new MeUseCase(repo);

    expect(useCase.execute("nonexistent")).rejects.toThrow(AppError);
  });
});
