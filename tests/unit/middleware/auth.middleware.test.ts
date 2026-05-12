import { describe, it, expect, beforeEach, mock } from "bun:test";
import { createAuthMiddleware, requireRole } from "../../../src/server/infrastructure/http/middleware/auth.middleware";
import { MockTokenService } from "../../mocks/token.service.mock";
import { InMemoryUserRepository } from "../../mocks/user.in-memory.repository";
import { OpenAPIHono } from "@hono/zod-openapi";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";
import bcrypt from "bcryptjs";

const passwordHash = await bcrypt.hash("password123", 12);

let userRepository: InMemoryUserRepository;
let tokenService: MockTokenService;
let authMiddleware: ReturnType<typeof createAuthMiddleware>;

const makeApp = () => {
  const app = new OpenAPIHono();
  app.onError(errorHandler);
  app.use("*", authMiddleware);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
};

beforeEach(async () => {
  userRepository = new InMemoryUserRepository();
  tokenService = new MockTokenService();

  const user = await userRepository.create({
    email: "test@example.com",
    name: "Test",
    passwordHash,
  });
  await userRepository.markAsVerified(user.id);

  authMiddleware = createAuthMiddleware({
    tokenService,
    userRepository,
    tokenBlacklistService: {
      blacklist: mock(async () => {}),
      isBlacklisted: mock(async () => false),
    },
  });
});

describe("createAuthMiddleware", () => {
  it("returns 401 when no Authorization header", async () => {
    const app = makeApp();
    const res = await app.request("/test");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 for malformed Bearer header", async () => {
    const app = makeApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid token", async () => {
    const app = makeApp();
    const res = await app.request("/test", {
      headers: { Authorization: "Bearer invalid.token.here" },
    });
    expect(res.status).toBe(401);
  });

  it("returns 401 for blacklisted token (jti)", async () => {
    const freshRepo = new InMemoryUserRepository();
    const freshTokenService = new MockTokenService();

    const user = await freshRepo.create({
      email: "blacklist@example.com",
      name: "Test",
      passwordHash,
    });
    await freshRepo.markAsVerified(user.id);

    const blacklistedToken = await freshTokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: [],
    });

    const blacklistedMiddleware = createAuthMiddleware({
      tokenService: freshTokenService,
      userRepository: freshRepo,
      tokenBlacklistService: {
        blacklist: mock(async () => {}),
        isBlacklisted: mock(async () => true),
      },
    });

    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", blacklistedMiddleware);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: `Bearer ${blacklistedToken}` },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when user no longer exists", async () => {
    const token = await tokenService.generateAccessToken({
      userId: "deleted-user-id",
      email: "deleted@example.com",
      roles: [],
    });

    const app = makeApp();
    const res = await app.request("/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(401);
  });

  it("passes through with valid token and sets context values", async () => {
    const user = await userRepository.create({
      email: "context@example.com",
      name: "Test",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);

    const token = await tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: ["admin", "user"],
    });

    let capturedUserId: string | undefined;
    let capturedRoles: string[] | undefined;

    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get("/test", (c) => {
      capturedUserId = c.get("userId");
      capturedRoles = c.get("roles");
      return c.json({ ok: true });
    });

    const res = await app.request("/test", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(capturedUserId).toBe(user.id);
    expect(capturedRoles).toContain("admin");
    expect(capturedRoles).toContain("user");
  });
});

describe("requireRole", () => {
  it("returns 403 when user lacks required role", async () => {
    const user = await userRepository.create({
      email: "norole@example.com",
      name: "Test",
      passwordHash,
    });
    await userRepository.markAsVerified(user.id);

    const token = await tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: ["user"],
    });

    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", authMiddleware);
    app.get(
      "/admin",
      (c, next) => requireRole("admin")(c, next),
      (c) => c.json({ ok: true }),
    );

    const res = await app.request("/admin", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
  });
});
