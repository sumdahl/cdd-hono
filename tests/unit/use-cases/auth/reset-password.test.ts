import { describe, it, expect, beforeEach } from "bun:test";
import { ResetPasswordUseCase } from "../../../../src/server/core/use-cases/auth/reset-password";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryPasswordResetTokenRepository } from "../../../mocks/password-reset-token.in-memory.repository";
import { ErrorCode } from "../../../../src/server/core/errors";
import bcryptjs from "bcryptjs";

let userRepository: InMemoryUserRepository;
let passwordResetTokenRepository: InMemoryPasswordResetTokenRepository;
let useCase: ResetPasswordUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
  useCase = new ResetPasswordUseCase(userRepository, passwordResetTokenRepository);
});

describe("ResetPasswordUseCase", () => {
  it("resets password with valid token", async () => {
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: "oldhash",
    });
    const token = "valid-token-abc";
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await passwordResetTokenRepository.save(user.id, token, expiresAt);

    await useCase.execute({ token, password: "newpassword123" });

    const updated = await userRepository.findByEmail("user@example.com");
    expect(bcryptjs.compareSync("newpassword123", updated!.passwordHash)).toBe(true);
  });

  it("deletes token after successful reset", async () => {
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: "oldhash",
    });
    const token = "valid-token-abc";
    await passwordResetTokenRepository.save(
      user.id,
      token,
      new Date(Date.now() + 60 * 60 * 1000),
    );

    await useCase.execute({ token, password: "newpassword123" });

    const record = await passwordResetTokenRepository.find(token);
    expect(record).toBeNull();
  });

  it("throws PASSWORD_RESET_TOKEN_INVALID for unknown token", async () => {
    await expect(
      useCase.execute({ token: "no-such-token", password: "newpassword123" }),
    ).rejects.toMatchObject({ code: ErrorCode.PASSWORD_RESET_TOKEN_INVALID });
  });

  it("throws PASSWORD_RESET_TOKEN_EXPIRED and deletes token for expired token", async () => {
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: "oldhash",
    });
    const token = "expired-token";
    await passwordResetTokenRepository.save(
      user.id,
      token,
      new Date(Date.now() - 1000),
    );

    await expect(
      useCase.execute({ token, password: "newpassword123" }),
    ).rejects.toMatchObject({ code: ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED });

    const record = await passwordResetTokenRepository.find(token);
    expect(record).toBeNull();
  });

  it("old password no longer works after reset", async () => {
    const oldPassword = "oldpassword123";
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: bcryptjs.hashSync(oldPassword, 12),
    });
    const token = "valid-token-abc";
    await passwordResetTokenRepository.save(
      user.id,
      token,
      new Date(Date.now() + 60 * 60 * 1000),
    );

    await useCase.execute({ token, password: "brandnewpassword!" });

    const updated = await userRepository.findByEmail("user@example.com");
    expect(bcryptjs.compareSync(oldPassword, updated!.passwordHash)).toBe(false);
  });
});
