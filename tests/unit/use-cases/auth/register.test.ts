import { describe, it, expect, beforeEach } from "bun:test";
import { RegisterUseCase } from "../../../../src/server/core/use-cases/auth/register";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryVerificationTokenRepository } from "../../../mocks/verification-token.in-memory.repository";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";
import { MockEmailService } from "../../../mocks/email.service.mock";
import { AppError } from "../../../../src/server/core/errors";

let userRepository: InMemoryUserRepository;
let verificationTokenRepository: InMemoryVerificationTokenRepository;
let emailService: MockEmailService;
let roleRepository: InMemoryRoleRepository;
let useCase: RegisterUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  verificationTokenRepository = new InMemoryVerificationTokenRepository();
  emailService = new MockEmailService();
  roleRepository = new InMemoryRoleRepository();
  useCase = new RegisterUseCase(
    userRepository,
    verificationTokenRepository,
    emailService,
    roleRepository,
  );
});

describe("RegisterUseCase", () => {
  it("should register a new user", async () => {
    const result = await useCase.execute({
      email: "sumiran@example.com",
      name: "Sumiran",
      password: "password123",
    });

    expect(result.email).toBe("sumiran@example.com");
    expect(result.name).toBe("Sumiran");
    expect(result.verificationEmailSent).toBe(true);
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("should assign default user role on registration", async () => {
    const result = await useCase.execute({
      email: "sumiran@example.com",
      name: "Sumiran",
      password: "password123",
    });

    const roles = await roleRepository.findRolesByUserId(result.id);
    expect(roles.some((r) => r.name === "user")).toBe(true);
  });

  it("should send a verification email after registration", async () => {
    await useCase.execute({
      email: "sumiran@example.com",
      name: "Sumiran",
      password: "password123",
    });

    const email = emailService.getLastVerificationEmail();
    expect(email).not.toBeNull();
    expect(email?.to).toBe("sumiran@example.com");
    expect(email?.token).toBeTruthy();
  });

  it("should throw EMAIL_TAKEN if email already exists", async () => {
    await useCase.execute({
      email: "sumiran@example.com",
      name: "Sumiran",
      password: "password123",
    });

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        name: "Sumiran",
        password: "password123",
      }),
    ).rejects.toThrow(AppError);
  });
});
