import { OpenAPIHono } from "@hono/zod-openapi";
import { todoRouter } from "./infrastructure/http/todos";
import { authRouter } from "./infrastructure/http/auth";
import { healthRouter } from "./infrastructure/http/health/health.routes";
import { corsMiddleware } from "./infrastructure/http/middleware/cors";
import { requestLogger } from "./infrastructure/http/middleware/logger";
import { rateLimiter } from "./infrastructure/http/middleware/rate-limiter";
import { errorHandler } from "./infrastructure/http/middleware/error-handler";
import { ErrorCode } from "./core/errors";

export const app = new OpenAPIHono().basePath("/api/v1");

app.use("*", corsMiddleware);
app.use(
  "*",
  rateLimiter({ limit: 100, windowMs: 60_000, keyPrefix: "global" }),
);
app.use(
  "/auth/*",
  rateLimiter({ limit: 10, windowMs: 60_000, keyPrefix: "auth-routes" }),
);
app.use("*", requestLogger);

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
app.route("/todos", todoRouter);

app.onError(errorHandler);
