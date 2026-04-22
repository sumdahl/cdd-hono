import { OpenAPIHono } from "@hono/zod-openapi";
import { todoRouter } from "./infrastructure/http/todos";
import { authRouter } from "./infrastructure/http/auth";
import { requestLogger } from "./infrastructure/http/middleware/logger";
import {
  AppError,
  formatError,
} from "./infrastructure/http/middleware/error-handler";
import { healthRouter } from "./infrastructure/http/health/health.routes";

const apiRouter = new OpenAPIHono().basePath("/api/v1");

apiRouter.use("*", requestLogger);

apiRouter.onError((err, c) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);
  if (err instanceof AppError) {
    return c.json(
      formatError(err.code, err.message),
      err.statusCode as 400 | 401 | 404 | 409 | 422 | 500,
    );
  }
  if (err.name === "ZodError") {
    try {
      const issues = JSON.parse(err.message);
      return c.json(
        formatError(
          "VALIDATION_ERROR",
          "Invalid request data",
          issues.map((i: { path: string[]; message: string }) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        ),
        422,
      );
    } catch {
      return c.json(
        formatError("VALIDATION_ERROR", "Invalid request data"),
        422,
      );
    }
  }
  return c.json(
    formatError("INTERNAL_SERVER_ERROR", "Something went wrong"),
    500,
  );
});

apiRouter.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404,
  );
});

apiRouter.route("/todos", todoRouter);
apiRouter.route("/health", healthRouter);
apiRouter.route("/auth", authRouter);

export const appRouter = new OpenAPIHono();
appRouter.route("/", apiRouter);
