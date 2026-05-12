import { describe, it, expect, beforeEach } from "bun:test";
import { rateLimiter } from "../../../src/server/infrastructure/http/middleware/rate-limiter";
import { OpenAPIHono } from "@hono/zod-openapi";
import { errorHandler } from "../../../src/server/infrastructure/http/middleware/error-handler";
import { MockRateLimiterService } from "../../mocks/rate-limiter.service.mock";

let rateLimiterService: MockRateLimiterService;

const makeApp = () => {
  const app = new OpenAPIHono();
  app.onError(errorHandler);
  app.use(
    "*",
    rateLimiter({ rateLimiterService, limit: 5, windowMs: 60_000 }),
  );
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
};

beforeEach(() => {
  rateLimiterService = new MockRateLimiterService();
});

describe("rateLimiter", () => {
  it("allows first request and sets rate limit headers", async () => {
    const app = makeApp();
    const res = await app.request("/test");
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
  });

  it("allows requests under the limit", async () => {
    const app = makeApp();
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test");
      expect(res.status).toBe(200);
    }
  });

  it("returns 429 when limit is exceeded", async () => {
    const service = new MockRateLimiterService();
    service.setResponse(false);

    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use(
      "*",
      rateLimiter({ rateLimiterService: service, limit: 5, windowMs: 60_000 }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error.code).toBe("TOO_MANY_REQUESTS");
  });

  it("allows requests when rate limiter returns true", async () => {
    const service = new MockRateLimiterService();
    service.setResponse(true);

    const app = new OpenAPIHono();
    app.onError(errorHandler);
    app.use(
      "*",
      rateLimiter({ rateLimiterService: service, limit: 5, windowMs: 60_000 }),
    );
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
  });

  it("sets X-RateLimit-Limit header on all responses", async () => {
    const app = makeApp();
    const res = await app.request("/test");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
  });
});
