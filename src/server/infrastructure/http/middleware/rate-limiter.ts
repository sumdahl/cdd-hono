import { MiddlewareHandler } from "hono";
import { formatError } from "./error-handler";

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
};

type ClientRecord = {
  count: number;
  resetAt: number;
};

export function rateLimiter({
  limit,
  windowMs,
}: RateLimiterOptions): MiddlewareHandler {
  const store = new Map<string, ClientRecord>();

  setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of store.entries()) {
        if (record.resetAt < now) store.delete(key);
      }
    },
    5 * 60 * 1000,
  );

  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown";

    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    const record = store.get(key);

    if (!record || record.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", String(limit - 1));
      await next();
      return;
    }

    if (record.count >= limit) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      c.header("Retry-After", String(retryAfter));
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", "0");
      return c.json(
        formatError(
          "RATE_LIMIT_EXCEEDED",
          "Too many requests, please try again later.",
        ),
        429 as 429,
      );
    }

    record.count++;
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(limit - record.count));
    await next();
  };
}
