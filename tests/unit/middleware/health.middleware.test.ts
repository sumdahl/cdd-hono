import { describe, it, expect, beforeEach } from "bun:test";
import { createHealthRouter } from "../../../src/server/infrastructure/http/health/health.routes";
import { MockHealthCheckService } from "../../mocks/health-check.service.mock";
import { OpenAPIHono } from "@hono/zod-openapi";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";

let healthCheckService: MockHealthCheckService;

const makeApp = () => {
  const app = new OpenAPIHono();
  app.onError(errorHandler);
  app.route("/health", createHealthRouter({ healthCheckService }));
  return app;
};

beforeEach(() => {
  healthCheckService = new MockHealthCheckService();
});

describe("createHealthRouter", () => {
  it("returns 200 with ok status when DB is healthy", async () => {
    healthCheckService.setResponse({ status: "ok", latencyMs: 5 });
    const app = makeApp();
    const res = await app.request("/health");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.services.database.status).toBe("ok");
    expect(body.uptime).toBeGreaterThan(0);
    expect(body.timestamp).toBeTruthy();
  });

  it("returns 503 with degraded status when DB is down", async () => {
    healthCheckService.setResponse({ status: "degraded", latencyMs: 5 });
    const app = makeApp();
    const res = await app.request("/health");
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.services.database.status).toBe("error");
  });

  it("includes latencyMs in response", async () => {
    healthCheckService.setResponse({ status: "ok", latencyMs: 42 });
    const app = makeApp();
    const res = await app.request("/health");
    const body = await res.json();
    expect(body.services.database.latencyMs).toBe(42);
  });

  it("has correct response schema structure", async () => {
    healthCheckService.setResponse({ status: "ok", latencyMs: 1 });
    const app = makeApp();
    const res = await app.request("/health");
    const body = await res.json();
    expect(body).toHaveProperty("status");
    expect(body).toHaveProperty("uptime");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("services");
    expect(body.services).toHaveProperty("database");
    expect(body.services.database).toHaveProperty("status");
  });

  it("maps degraded status to database error", async () => {
    healthCheckService.setResponse({ status: "degraded", latencyMs: 10 });
    const app = makeApp();
    const res = await app.request("/health");
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.services.database.status).toBe("error");
  });
});