import { Context } from "hono";
import { AppError, ErrorCode } from "../../../core/errors";
import { formatError } from "../response/response";
import { logger } from "../../logger";

export const errorHandler = (err: Error, c: Context) => {
  const requestId = c.get("requestId") ?? "unknown";

  const meta = {
    requestId,
    method: c.req.method,
    path: c.req.path,
    err: {
      name: err.name,
      message: err.message,
      ...(err instanceof AppError && {
        code: err.code,
        statusCode: err.statusCode,
      }),
      stack: err.stack,
    },
  };

  if (err instanceof AppError) {
    // DB errors → 503 Service Unavailable
    if (err.code === ErrorCode.DB_ERROR) {
      logger.error(meta, "database error");
      return c.json(
        formatError(
          ErrorCode.DB_ERROR,
          "Service temporarily unavailable. Please try again later.",
        ),
        503,
      );
    }

    logger.warn(meta, "domain error");
    return c.json(formatError(err.code, err.message), err.statusCode);
  }

  if (err.name === "ZodError") {
    logger.warn({ ...meta, type: "validation" }, "validation error");
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

  logger.error(meta, "unexpected error");
  return c.json(
    formatError("INTERNAL_SERVER_ERROR", "Something went wrong"),
    500,
  );
};
