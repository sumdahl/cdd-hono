import { OpenAPIHono } from "@hono/zod-openapi";
import { formatError } from "../response/response.formatter";

export const createAppRouter = () =>
  new OpenAPIHono({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          formatError(
            "VALIDATION_ERROR",
            "Invalid request data",
            result.error.issues.map((i) => ({
              path: i.path.join("."),
              message: i.message,
            })),
          ),
          422,
        );
      }
    },
  });
