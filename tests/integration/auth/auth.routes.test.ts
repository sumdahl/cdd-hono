import { describe, it, expect, beforeAll } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { RegisterUseCase } from "../../../src/server/core/use-cases/auth/register";
import { LoginUseCase } from "../../../src/server/core/use-cases/auth/login";
import { RefreshUseCase } from "../../../src/server/core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../../src/server/core/use-cases/auth/logout";
import { MeUseCase } from "../../../src/server/core/use-cases/auth/me";
import { createAuthRouter } from "../../../src/server/infrastructure/http/auth/auth.routes";
import { InMemoryUserRepository } from "../../mocks/user.in-memory.repository";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";

let app: OpenAPIHono;

beforeAll(() => {
  const repository = new InMemoryUserRepository();
  const authRouter = createAuthRouter(
    new RegisterUseCase(repository),
    new LoginUseCase(repository),
    new RefreshUseCase(repository),
    new LogoutUseCase(repository),
    new MeUseCase(repository),
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
  it("should login and return tokens", async () => {
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
