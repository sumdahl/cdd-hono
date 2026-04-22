import type { MiddlewareHandler, Context } from "hono";
import { formatError } from "../response/response.formatter";

export type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  keyPrefix?: string;
  keyGenerator?: (c: Context) => string;
};

type ClientRecord = {
  count: number;
  resetAt: number;
};

export function rateLimiter({
  limit,
  windowMs,
  keyPrefix,
  keyGenerator,
}: RateLimiterOptions): MiddlewareHandler {
  const store = new Map<string, ClientRecord>();

  const cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [key, record] of store.entries()) {
        if (record.resetAt < now) {
          store.delete(key);
        }
      }
    },
    Math.max(windowMs, 60_000),
  );

  if (typeof cleanupInterval.unref === "function") {
    cleanupInterval.unref();
  }

  return async (c, next) => {
    const now = Date.now();

    let key: string;
    if (keyGenerator) {
      key = keyGenerator(c);
    } else {
      const ip =
        c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
        c.req.header("x-real-ip") ??
        "unknown";

      const identifier = keyPrefix ?? c.req.path;
      key = `${ip}:${identifier}`;
    }

    let record = store.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 1, resetAt: now + windowMs };
      store.set(key, record);

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
        429 as const,
      );
    }

    record.count++;
    c.header("X-RateLimit-Limit", String(limit));
    c.header("X-RateLimit-Remaining", String(limit - record.count));

    await next();
  };
}
