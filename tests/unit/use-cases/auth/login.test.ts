import { describe, it, expect, beforeEach } from "bun:test";
import { LoginUseCase } from "../../../../src/server/core/use-cases/auth/login";
import { InMemoryUserRepository } from "../../../mocks/user.in-memory.repository";
import { InMemoryTokenRepository } from "../../../mocks/token.in-memory.repository";
import { InMemoryRoleRepository } from "../../../mocks/role.in-memory.repository";
import { MockTokenService } from "../../../mocks/token.service.mock";
import { AppError } from "../../../../src/server/core/errors";
import bcrypt from "bcryptjs";

const passwordHash = await bcrypt.hash("password123", 12);

let userRepository: InMemoryUserRepository;
let tokenRepository: InMemoryTokenRepository;
let roleRepository: InMemoryRoleRepository;
let tokenService: MockTokenService;
let useCase: LoginUseCase;

beforeEach(() => {
  userRepository = new InMemoryUserRepository();
  tokenRepository = new InMemoryTokenRepository();
  roleRepository = new InMemoryRoleRepository();
  tokenService = new MockTokenService();
  useCase = new LoginUseCase(userRepository, tokenRepository, roleRepository, tokenService);
});

describe("LoginUseCase", () => {
  it("should return tokens on valid credentials for verified user", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);

    const result = await useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(result.user.email).toBe("sumiran@example.com");
    expect(result.user).toHaveProperty("roles");
  });

  it("should include roles in response", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);
    const userRole = await roleRepository.findByName("user");
    await roleRepository.assignRoleToUser(user.id, userRole!.id);

    const result = await useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    expect(result.user.roles).toContain("user");
  });

  it("should embed roles in the generated access token", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);
    const userRole = await roleRepository.findByName("user");
    await roleRepository.assignRoleToUser(user.id, userRole!.id);

    await useCase.execute({
      email: "sumiran@example.com",
      password: "password123",
    });

    const generatedToken = tokenService.accessTokens[0];
    const decoded = await tokenService.verifyAccessToken(generatedToken);
    expect(decoded.roles).toContain("user");
  });

  it("should throw EMAIL_NOT_VERIFIED for unverified user", async () => {
    await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        password: "password123",
      }),
    ).rejects.toThrow(AppError);
  });

  it("should throw INVALID_CREDENTIALS on wrong password", async () => {
    const user = await userRepository.create({
      email: "sumiran@example.com",
      name: "Sumiran",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);

    expect(
      useCase.execute({
        email: "sumiran@example.com",
        password: "wrongpassword",
      }),
    ).rejects.toThrow(AppError);
  });

  it("should throw INVALID_CREDENTIALS if user not found", async () => {
    expect(
      useCase.execute({ email: "noone@example.com", password: "password123" }),
    ).rejects.toThrow(AppError);
  });
});
