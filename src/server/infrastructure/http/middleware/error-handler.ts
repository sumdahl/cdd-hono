import { Context } from "hono";
import { AppError } from "../../../core/errors";
import { formatError } from "../response/response.formatter";

export const errorHandler = (err: Error, c: Context) => {
  console.error(`[ERROR] ${c.req.method} ${c.req.path}:`, err.message);

  if (err instanceof AppError) {
    return c.json(formatError(err.code, err.message), err.statusCode);
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
};
