import type { MiddlewareHandler, Context } from "hono";
import { createMiddleware } from "hono/factory";
import { ErrorCode } from "../../../core/errors";
import { IRateLimiterService } from "../../../core/services/rate-limiter.service";
import { formatError } from "../response/response";

export type RateLimiterOptions = {
  rateLimiterService: IRateLimiterService;
  limit: number;
  windowMs: number;
  keyPrefix?: string;
  keyGenerator?: (c: Context) => string;
};

export function rateLimiter({
  rateLimiterService,
  limit,
  windowMs,
  keyPrefix,
  keyGenerator,
}: RateLimiterOptions): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
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

    const allowed = await rateLimiterService.isAllowed(key, limit, windowMs);

    c.header("X-RateLimit-Limit", String(limit));

    if (!allowed) {
      c.header("X-RateLimit-Remaining", "0");
      return c.json(
        formatError(
          ErrorCode.TOO_MANY_REQUESTS,
          "Too many requests, please try again later.",
        ),
        429 as const,
      );
    }

    await next();
  });
}
