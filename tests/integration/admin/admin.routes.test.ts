// @.rules
import { beforeAll, describe, expect, it } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { AssignRoleUseCase } from "../../../src/server/core/use-cases/admin/assign-role";
import { DeleteUserUseCase } from "../../../src/server/core/use-cases/admin/delete-user";
import { GetAllRolesUseCase } from "../../../src/server/core/use-cases/admin/get-all-roles";
import { GetAllUsersUseCase } from "../../../src/server/core/use-cases/admin/get-all-users";
import { GetUserByIdUseCase } from "../../../src/server/core/use-cases/admin/get-user-by-id";
import { RemoveRoleUseCase } from "../../../src/server/core/use-cases/admin/remove-role";
import { createAdminRouter } from "../../../src/server/infrastructure/http/admin/admin.routes";
import { createAuthMiddleware } from "../../../src/server/infrastructure/http/middleware/auth.middleware";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";
import { MockTokenService } from "../../mocks/token.service.mock";
import { InMemoryRoleRepository } from "../../mocks/role.in-memory.repository";
import { InMemoryUserRepository } from "../../mocks/user.in-memory.repository";
import { MockTokenService } from "../../mocks/token.service.mock";

let app: OpenAPIHono;
let userRepository: InMemoryUserRepository;
let roleRepository: InMemoryRoleRepository;
let adminToken: string;
let userToken: string;
let adminUserId: string;
let regularUserId: string;

beforeAll(async () => {
  userRepository = new InMemoryUserRepository();
  roleRepository = new InMemoryRoleRepository();

  const adminUser = await userRepository.create({
    email: "admin@test.com",
    name: "Admin",
    passwordHash: "hash",
  });
  const regularUser = await userRepository.create({
    email: "user@test.com",
    name: "User",
    passwordHash: "hash",
  });

  adminUserId = adminUser.id;
  regularUserId = regularUser.id;

  const adminRole = await roleRepository.findByName("admin");
  await roleRepository.assignRoleToUser(adminUserId, adminRole!.id);

  const tokenService = new MockTokenService();
  adminToken = await tokenService.generateAccessToken({
    userId: adminUserId,
    email: adminUser.email,
    roles: ["admin"],
  });
  userToken = await tokenService.generateAccessToken({
    userId: regularUserId,
    email: regularUser.email,
    roles: ["user"],
  });

  const authMiddleware = createAuthMiddleware({
    tokenService,
    userRepository,
    tokenBlacklistService: {
      blacklist: async () => {},
      isBlacklisted: async () => false,
    },
  });

  const adminRouter = createAdminRouter(
    {
      getAllUsersUseCase: new GetAllUsersUseCase(userRepository, roleRepository),
      getUserByIdUseCase: new GetUserByIdUseCase(userRepository, roleRepository),
      deleteUserUseCase: new DeleteUserUseCase(userRepository),
      getAllRolesUseCase: new GetAllRolesUseCase(roleRepository),
      assignRoleUseCase: new AssignRoleUseCase(userRepository, roleRepository),
      removeRoleUseCase: new RemoveRoleUseCase(userRepository, roleRepository),
    },
    { authMiddleware },
  );

  app = new OpenAPIHono();
  app.onError(errorHandler);
  app.route("/api/v1/admin", adminRouter);
});

describe("GET /api/v1/admin/users", () => {
  it("returns 401 when no auth token provided", async () => {
    const res = await app.request("/api/v1/admin/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    const res = await app.request("/api/v1/admin/users", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("returns 200 with paginated users when authenticated as admin", async () => {
    const res = await app.request("/api/v1/admin/users", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty("data");
    expect(body.data).toHaveProperty("meta");
    expect(Array.isArray(body.data.data)).toBe(true);
  });

  it("respects pagination query params", async () => {
    const res = await app.request("/api/v1/admin/users?page=1&limit=1", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.data).toHaveLength(1);
    expect(body.data.meta.limit).toBe(1);
  });
});

describe("GET /api/v1/admin/users/:userId", () => {
  it("returns 401 when no auth token provided", async () => {
    const res = await app.request(`/api/v1/admin/users/${adminUserId}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    const res = await app.request(`/api/v1/admin/users/${adminUserId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("returns 200 with user when found", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.data.user.id).toBe(regularUserId);
    expect(body.data.user.email).toBe("user@test.com");
    expect(body.data.user).not.toHaveProperty("passwordHash");
  });

  it("returns 404 when user does not exist", async () => {
    const res = await app.request("/api/v1/admin/users/non-existent-id", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe("USER_NOT_FOUND");
  });
});

describe("DELETE /api/v1/admin/users/:userId", () => {
  it("returns 401 when no auth token provided", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("returns 403 when admin tries to delete their own account", async () => {
    const res = await app.request(`/api/v1/admin/users/${adminUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 200 and deletes user successfully", async () => {
    const throwaway = await userRepository.create({
      email: "throwaway@test.com",
      name: "Throwaway",
      passwordHash: "hash",
    });

    const res = await app.request(`/api/v1/admin/users/${throwaway.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status).toBe(200);
  });
});

describe("GET /api/v1/admin/roles", () => {
  it("returns 401 when no auth token provided", async () => {
    const res = await app.request("/api/v1/admin/roles");
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    const res = await app.request("/api/v1/admin/roles", {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res.status).toBe(403);
  });

  it("returns 200 with paginated roles when authenticated as admin", async () => {
    const res = await app.request("/api/v1/admin/roles", {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.data)).toBe(true);
    expect(body.data.data.length).toBeGreaterThan(0);
  });
});

describe("POST /api/v1/admin/users/:userId/roles", () => {
  it("returns 401 when no auth token provided", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "moderator" }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "moderator" }),
    });
    expect(res.status).toBe(403);
  });

  it("returns 422 on missing role field", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(422);
  });

  it("returns 200 when role is assigned successfully", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "moderator" }),
    });
    expect(res.status).toBe(200);
  });

  it("returns 404 when role does not exist", async () => {
    const res = await app.request(`/api/v1/admin/users/${regularUserId}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "non-existent-role" }),
    });
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROLE_NOT_FOUND");
  });
});

describe("DELETE /api/v1/admin/users/:userId/roles/:roleName", () => {
  it("returns 401 when no auth token provided", async () => {
    const res = await app.request(
      `/api/v1/admin/users/${regularUserId}/roles/moderator`,
      { method: "DELETE" },
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when authenticated as non-admin", async () => {
    const res = await app.request(
      `/api/v1/admin/users/${regularUserId}/roles/moderator`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );
    expect(res.status).toBe(403);
  });

  it("returns 200 when role is removed successfully", async () => {
    const res = await app.request(
      `/api/v1/admin/users/${regularUserId}/roles/moderator`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    expect(res.status).toBe(200);
  });

  it("returns 409 when removing the last admin role", async () => {
    const res = await app.request(
      `/api/v1/admin/users/${adminUserId}/roles/admin`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe("LAST_ADMIN");
  });
});
