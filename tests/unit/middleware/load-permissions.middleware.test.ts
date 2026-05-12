import { describe, it, expect, beforeEach } from "bun:test";
import { createLoadPermissions } from "../../../src/server/infrastructure/http/middleware/load-permissions.middleware";
import { InMemoryRoleRepository } from "../../mocks/role.in-memory.repository";
import { OpenAPIHono } from "@hono/zod-openapi";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";

let roleRepository: InMemoryRoleRepository;
let loadPermissions: ReturnType<typeof createLoadPermissions>;

const makeApp = () => {
  const app = new OpenAPIHono();
  app.onError(errorHandler);
  app.use("*", loadPermissions);
  app.get("/test", (c) => {
    const permissions = c.get("permissions");
    return c.json({ permissions });
  });
  return app;
};

beforeEach(async () => {
  roleRepository = new InMemoryRoleRepository();
  loadPermissions = createLoadPermissions({ roleRepository });
});

describe("createLoadPermissions", () => {
  it("sets permissions to empty array when no roles in context", async () => {
    const app = makeApp();
    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.permissions).toEqual([]);
  });

  it("sets permissions to empty array when roles is empty array", async () => {
    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", (c, next) => {
      c.set("roles", []);
      return next();
    });
    app.use("*", loadPermissions);
    app.get("/test", (c) => c.json({ permissions: c.get("permissions") }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.permissions).toEqual([]);
  });

  it("loads permissions for user role", async () => {
    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", (c, next) => {
      c.set("roles", ["user"]);
      return next();
    });
    app.use("*", loadPermissions);
    app.get("/test", (c) => c.json({ permissions: c.get("permissions") }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.permissions)).toBe(true);
  });

  it("loads permissions for admin role", async () => {
    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", (c, next) => {
      c.set("roles", ["admin"]);
      return next();
    });
    app.use("*", loadPermissions);
    app.get("/test", (c) => c.json({ permissions: c.get("permissions") }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.permissions)).toBe(true);
    expect(body.permissions.length).toBeGreaterThan(0);
  });

  it("loads permissions for multiple roles", async () => {
    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use("*", (c, next) => {
      c.set("roles", ["user", "admin"]);
      return next();
    });
    app.use("*", loadPermissions);
    app.get("/test", (c) => c.json({ permissions: c.get("permissions") }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.permissions)).toBe(true);
  });
});
