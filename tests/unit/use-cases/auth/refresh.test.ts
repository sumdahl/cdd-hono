import { describe, it, expect, mock } from "bun:test";
import { RefreshUseCase } from "../../../../src/server/core/use-cases/auth/refresh";
import { IUserRepository } from "../../../../src/server/core/repositories/user.repository";
import { UserEntity } from "../../../../src/server/core/entities/user.entity";
import { AppError, ErrorCode } from "../../../../src/server/core/errors";
import jwt from "jsonwebtoken";

const mockUser = new UserEntity(
  "1",
  "sumiran@example.com",
  "Sumiran",
  "hash",
  new Date(),
);
const validToken = jwt.sign(
  { sub: "1" },
  process.env.JWT_REFRESH_SECRET ?? "test-secret",
  { expiresIn: "7d" },
);
const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const mockRepository: IUserRepository = {
  findById: mock(async () => mockUser),
  findByEmail: mock(async () => null),
  create: mock(async () => mockUser),
  saveRefreshToken: mock(async () => {}),
  findRefreshToken: mock(async () => ({ userId: "1", expiresAt: futureDate })),
  deleteRefreshToken: mock(async () => {}),
  deleteAllRefreshTokens: mock(async () => {}),
};

describe("RefreshUseCase", () => {
  it("should return new access token for valid refresh token", async () => {
    const useCase = new RefreshUseCase(mockRepository);
    const result = await useCase.execute(validToken);

    expect(result).toHaveProperty("accessToken");
  });

  it("should throw INVALID_TOKEN if token not in DB", async () => {
    const repo = {
      ...mockRepository,
      findRefreshToken: mock(async () => null),
    };
    const useCase = new RefreshUseCase(repo);

    expect(useCase.execute(validToken)).rejects.toThrow(AppError);
  });

  it("should throw TOKEN_EXPIRED if token is expired in DB", async () => {
    const repo = {
      ...mockRepository,
      findRefreshToken: mock(async () => ({
        userId: "1",
        expiresAt: new Date(Date.now() - 1000),
      })),
    };
    const useCase = new RefreshUseCase(repo);

    expect(useCase.execute(validToken)).rejects.toThrow(AppError);
  });
});
