import { OpenAPIHono } from "@hono/zod-openapi";
import { container } from "./infrastructure/di/container";
import { authRouter } from "./infrastructure/http/auth";
import { createHealthRouter } from "./infrastructure/http/health/health.routes";
import { corsMiddleware } from "./infrastructure/http/middleware/cors";
import { errorHandler } from "./infrastructure/http/middleware/error-handler";
import { createLoadPermissions } from "./infrastructure/http/middleware/load-permissions.middleware";
import { requestLogger } from "./infrastructure/http/middleware/logger";
import { rateLimiter } from "./infrastructure/http/middleware/rate-limiter";
import { adminRouter } from "./infrastructure/http/admin";
import { ErrorCode } from "./core/errors";

const { rateLimiterService, roleRepository, healthCheckService } = container.cradle;

const healthRouter = createHealthRouter({ healthCheckService });

export const app = new OpenAPIHono().basePath("/api/v1");

app.use("*", corsMiddleware);
app.use(
  "*",
  rateLimiter({
    rateLimiterService,
    limit: 100,
    windowMs: 60_000,
    keyPrefix: "global",
  }),
);
app.use(
  "/auth/*",
  rateLimiter({
    rateLimiterService,
    limit: 10,
    windowMs: 60_000,
    keyPrefix: "auth-routes",
  }),
);
app.use("*", requestLogger);
app.use("*", createLoadPermissions({ roleRepository }));

app.notFound((c) =>
  c.json(
    {
      success: false,
      error: {
        code: ErrorCode.NOT_FOUND,
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  ),
);

app.route("/health", healthRouter);
app.route("/auth", authRouter);
app.route("/admin", adminRouter);

app.onError(errorHandler);
