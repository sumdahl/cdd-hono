import { MiddlewareHandler } from "hono";
import { AppContext } from "../types/context";

export const requestLogger: MiddlewareHandler<AppContext> = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);

  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  console.log(`→ [${requestId}] ${method} ${path}`);

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(`← [${requestId}] ${method} ${path} ${status} ${duration}ms`);

  c.res.headers.set("X-Request-Id", requestId);
};
