// @.rules
import { describe, it, expect, beforeAll } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { ForgotPasswordUseCase } from "../../../src/server/core/use-cases/auth/forgot-password";
import { LoginUseCase } from "../../../src/server/core/use-cases/auth/login";
import { LogoutUseCase } from "../../../src/server/core/use-cases/auth/logout";
import { MeUseCase } from "../../../src/server/core/use-cases/auth/me";
import { RefreshUseCase } from "../../../src/server/core/use-cases/auth/refresh";
import { RegisterUseCase } from "../../../src/server/core/use-cases/auth/register";
import { ResendVerificationUseCase } from "../../../src/server/core/use-cases/auth/resend-verification";
import { ResetPasswordUseCase } from "../../../src/server/core/use-cases/auth/reset-password";
import { VerifyEmailUseCase } from "../../../src/server/core/use-cases/auth/verify-email";
import { createAuthRouter } from "../../../src/server/infrastructure/http/auth/auth.routes";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";
import { createAuthMiddleware } from "../../../src/server/infrastructure/http/middleware/auth.middleware";
import { InMemoryPasswordResetTokenRepository } from "../../mocks/password-reset-token.in-memory.repository";
import { InMemoryRoleRepository } from "../../mocks/role.in-memory.repository";
import { InMemoryTokenRepository } from "../../mocks/token.in-memory.repository";
import { InMemoryUserRepository } from "../../mocks/user.in-memory.repository";
import { InMemoryVerificationTokenRepository } from "../../mocks/verification-token.in-memory.repository";
import { MockEmailService } from "../../mocks/email.service.mock";
import { MockRateLimiterService } from "../../mocks/rate-limiter.service.mock";
import { MockTokenService } from "../../mocks/token.service.mock";

let app: OpenAPIHono;
let userRepository: InMemoryUserRepository;
let emailService: MockEmailService;

beforeAll(() => {
  userRepository = new InMemoryUserRepository();
  const tokenRepository = new InMemoryTokenRepository();
  const verificationTokenRepository = new InMemoryVerificationTokenRepository();
  const passwordResetTokenRepository =
    new InMemoryPasswordResetTokenRepository();
  const roleRepository = new InMemoryRoleRepository();
  emailService = new MockEmailService();
  const rateLimiterService = new MockRateLimiterService();
  const tokenService = new MockTokenService();

  const authMiddleware = createAuthMiddleware({
    tokenService,
    userRepository,
    tokenBlacklistService: {
      blacklist: async () => {},
      isBlacklisted: async () => false,
    },
  });

  const authRouter = createAuthRouter(
    {
      register: new RegisterUseCase(
        userRepository,
        verificationTokenRepository,
        emailService,
        roleRepository,
      ),
      login: new LoginUseCase(userRepository, tokenRepository, roleRepository, tokenService),
      refresh: new RefreshUseCase(userRepository, tokenRepository, tokenService),
      logout: new LogoutUseCase(tokenRepository),
      me: new MeUseCase(userRepository),
      verifyEmail: new VerifyEmailUseCase(userRepository, verificationTokenRepository),
      resendVerification: new ResendVerificationUseCase(
        userRepository,
        verificationTokenRepository,
        emailService,
        rateLimiterService,
      ),
      forgotPassword: new ForgotPasswordUseCase(
        userRepository,
        passwordResetTokenRepository,
        emailService,
        rateLimiterService,
      ),
      resetPassword: new ResetPasswordUseCase(
        userRepository,
        passwordResetTokenRepository,
        tokenRepository,
      ),
    },
    { authMiddleware },
  );

  app = new OpenAPIHono();
  app.onError(errorHandler);
  app.route("/api/v1/auth", authRouter);
});

describe("POST /api/v1/auth/register", () => {
  it("should register a new user and return 201", async () => {
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test",
        password: "password123",
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.data.user.email).toBe("test@example.com");
    expect(body.data.user).not.toHaveProperty("passwordHash");
  });

  it("should return 422 on invalid input", async () => {
    const res = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        name: "",
        password: "123",
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("should return 403 for unverified user", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("should login and return tokens after verification", async () => {
    const email = emailService.getLastVerificationEmail();
    expect(email).not.toBeNull();

    await app.request(`/api/v1/auth/verify-email?token=${email!.token}`);

    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data).toHaveProperty("accessToken");
    expect(body.data).toHaveProperty("refreshToken");
    expect(body.data.user.roles).toBeArray();
  });

  it("should return 401 on wrong password", async () => {
    const res = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "wrongpassword",
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
