import { describe, it, expect, mock } from "bun:test";
import { RefreshUseCase } from "../../../../src/server/core/use-cases/auth/refresh";
import { IUserRepository } from "../../../../src/server/core/repositories/user.repository";
import { ITokenRepository } from "../../../../src/server/core/repositories/token.repository";
import { UserEntity } from "../../../../src/server/core/entities/user.entity";
import { AppError } from "../../../../src/server/core/errors";
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

const mockUserRepository: IUserRepository = {
  findById: mock(async () => mockUser),
  findByEmail: mock(async () => null),
  create: mock(async () => mockUser),
};

const mockTokenRepository: ITokenRepository = {
  save: mock(async () => {}),
  find: mock(async () => ({ userId: "1", expiresAt: futureDate })),
  delete: mock(async () => {}),
  deleteAllForUser: mock(async () => {}),
};

describe("RefreshUseCase", () => {
  it("should return new access token for valid refresh token", async () => {
    const useCase = new RefreshUseCase(mockUserRepository, mockTokenRepository);
    const result = await useCase.execute(validToken);

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
  });

  it("should throw INVALID_TOKEN if token not in DB", async () => {
    const tokenRepo = { ...mockTokenRepository, find: mock(async () => null) };
    const useCase = new RefreshUseCase(mockUserRepository, tokenRepo);

    expect(useCase.execute(validToken)).rejects.toThrow(AppError);
  });

  it("should throw TOKEN_EXPIRED if token is expired in DB", async () => {
    const tokenRepo = {
      ...mockTokenRepository,
      find: mock(async () => ({
        userId: "1",
        expiresAt: new Date(Date.now() - 1000),
      })),
    };
    const useCase = new RefreshUseCase(mockUserRepository, tokenRepo);

    expect(useCase.execute(validToken)).rejects.toThrow(AppError);
  });
});
