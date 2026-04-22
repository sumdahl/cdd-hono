import { describe, it, expect, mock } from "bun:test";
import { LogoutUseCase } from "../../../../src/server/core/use-cases/auth/logout";
import { ITokenRepository } from "../../../../src/server/core/repositories/token.repository";
import { AppError } from "../../../../src/server/core/errors";

const mockTokenRepository: ITokenRepository = {
  save: mock(async () => {}),
  find: mock(async () => ({ userId: "1", expiresAt: new Date() })),
  delete: mock(async () => {}),
  deleteAllForUser: mock(async () => {}),
};

describe("LogoutUseCase", () => {
  it("should delete refresh token on logout", async () => {
    const useCase = new LogoutUseCase(mockTokenRepository);
    await useCase.execute("valid-token");

    expect(mockTokenRepository.delete).toHaveBeenCalledWith("valid-token");
  });

  it("should throw INVALID_TOKEN if token not found", async () => {
    const tokenRepo = { ...mockTokenRepository, find: mock(async () => null) };
    const useCase = new LogoutUseCase(tokenRepo);

    expect(useCase.execute("invalid-token")).rejects.toThrow(AppError);
  });
});
