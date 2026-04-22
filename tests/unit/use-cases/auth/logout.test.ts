import { describe, it, expect, mock } from "bun:test";
import { LogoutUseCase } from "../../../../src/server/core/use-cases/auth/logout";
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
  findRefreshToken: mock(async () => ({ userId: "1", expiresAt: new Date() })),
  deleteRefreshToken: mock(async () => {}),
  deleteAllRefreshTokens: mock(async () => {}),
};

describe("LogoutUseCase", () => {
  it("should delete refresh token on logout", async () => {
    const useCase = new LogoutUseCase(mockRepository);
    await useCase.execute("valid-token");

    expect(mockRepository.deleteRefreshToken).toHaveBeenCalledWith(
      "valid-token",
    );
  });

  it("should throw INVALID_TOKEN if token not found", async () => {
    const repo = {
      ...mockRepository,
      findRefreshToken: mock(async () => null),
    };
    const useCase = new LogoutUseCase(repo);

    expect(useCase.execute("invalid-token")).rejects.toThrow(AppError);
  });
});
