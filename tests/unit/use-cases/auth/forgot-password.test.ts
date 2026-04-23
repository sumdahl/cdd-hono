import { describe, it, expect, beforeEach } from "bun:test";
import { ForgotPasswordUseCase } from "../../../../src/server/core/use-cases/auth/forgot-password";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryPasswordResetTokenRepository } from "../../../mocks/password-reset-token.in-memory.repository";
import { MockEmailService } from "../../../mocks/email.service.mock";

let userRepository: InMemoryUserRepository;
let passwordResetTokenRepository: InMemoryPasswordResetTokenRepository;
let emailService: MockEmailService;
let useCase: ForgotPasswordUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();
  emailService = new MockEmailService();
  useCase = new ForgotPasswordUseCase(
    userRepository,
    passwordResetTokenRepository,
    emailService,
  );
});

describe("ForgotPasswordUseCase", () => {
  it("sends reset email for verified user", async () => {
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    await useCase.execute("user@example.com");

    const email = emailService.getLastPasswordResetEmail();
    expect(email).not.toBeNull();
    expect(email?.to).toBe("user@example.com");
    expect(email?.name).toBe("Test User");
    expect(email?.token).toBeString();
  });

  it("returns silently for unknown email — no error, no email", async () => {
    await useCase.execute("nobody@example.com");

    expect(emailService.sentEmails).toHaveLength(0);
  });

  it("returns silently for unverified user — no error, no email", async () => {
    await userRepository.create({
      email: "unverified@example.com",
      name: "Unverified",
      passwordHash: "hash",
    });

    await useCase.execute("unverified@example.com");

    expect(emailService.sentEmails).toHaveLength(0);
  });

  it("replaces existing token on second request", async () => {
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    await useCase.execute("user@example.com");
    const first = emailService.getLastPasswordResetEmail();

    await useCase.execute("user@example.com");
    const second = emailService.getLastPasswordResetEmail();

    expect(second?.token).not.toBe(first?.token);
  });

  it("saves token with 1-hour expiry", async () => {
    const user = await userRepository.create({
      email: "user@example.com",
      name: "Test User",
      passwordHash: "hash",
    });
    await userRepository.markAsVerified(user.id);

    const before = Date.now();
    await useCase.execute("user@example.com");
    const after = Date.now();

    const email = emailService.getLastPasswordResetEmail();
    const record = await passwordResetTokenRepository.find(email!.token);
    expect(record).not.toBeNull();
    expect(record!.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 60 * 60 * 1000 - 100);
    expect(record!.expiresAt.getTime()).toBeLessThanOrEqual(after + 60 * 60 * 1000 + 100);
  });
});
