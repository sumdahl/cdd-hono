import { describe, it, expect, beforeEach } from "bun:test";
import { VerifyEmailUseCase } from "../../../../src/server/core/use-cases/auth/verify-email";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryVerificationTokenRepository } from "../../../mocks/verification-token.in-memory.repository";
import { AppError } from "../../../../src/server/core/errors";

let userRepository: InMemoryUserRepository;
let verificationTokenRepository: InMemoryVerificationTokenRepository;
let useCase: VerifyEmailUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  verificationTokenRepository = new InMemoryVerificationTokenRepository();
  useCase = new VerifyEmailUseCase(userRepository, verificationTokenRepository);
});

describe("VerifyEmailUseCase", () => {
  it("should verify email with valid token", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await verificationTokenRepository.save(user.id, "valid-token", expiresAt);

    await useCase.execute("valid-token");

    const updated = await userRepository.findById(user.id);
    expect(updated?.isVerified).toBe(true);
  });

  it("should throw VERIFICATION_TOKEN_INVALID for unknown token", async () => {
    expect(useCase.execute("unknown-token")).rejects.toThrow(AppError);
  });

  it("should throw VERIFICATION_TOKEN_EXPIRED for expired token", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    const expiresAt = new Date(Date.now() - 1000);
    await verificationTokenRepository.save(user.id, "expired-token", expiresAt);

    expect(useCase.execute("expired-token")).rejects.toThrow(AppError);
  });

  it("should throw EMAIL_ALREADY_VERIFIED if user is already verified", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await verificationTokenRepository.save(user.id, "valid-token", expiresAt);

    expect(useCase.execute("valid-token")).rejects.toThrow(AppError);
  });
});
