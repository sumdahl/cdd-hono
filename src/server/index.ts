import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { todoRouter } from "./infrastructure/http/todos";
import { authRouter } from "./infrastructure/http/auth";
import { healthRouter } from "./infrastructure/http/health/health.routes";
import { requestLogger } from "./infrastructure/http/middleware/logger";
import { rateLimiter } from "./infrastructure/http/middleware/rate-limiter";
import { errorHandler } from "./infrastructure/http/middleware/error-handler";

const apiRouter = new OpenAPIHono().basePath("/api/v1");

apiRouter.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 86400,
    credentials: true,
  }),
);

apiRouter.use(
  "*",
  rateLimiter({
    limit: 100,
    windowMs: 60_000,
    keyPrefix: "global",
  }),
);

apiRouter.use(
  "/auth/*",
  rateLimiter({
    limit: 10,
    windowMs: 60_000,
    keyPrefix: "auth-routes",
  }),
);

apiRouter.use("*", requestLogger);

apiRouter.notFound((c) =>
  c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  ),
);

apiRouter.route("/health", healthRouter);
apiRouter.route("/auth", authRouter);
apiRouter.route("/todos", todoRouter);

export const appRouter = new OpenAPIHono();
appRouter.route("/", apiRouter);
appRouter.onError(errorHandler);
