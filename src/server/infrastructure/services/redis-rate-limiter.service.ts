import { Redis } from "ioredis";
import { IRateLimiterService } from "../../core/services/rate-limiter.service";
import { logger } from "../logger";

const KEY_PREFIX = "ratelimit:";

export class RedisRateLimiterService implements IRateLimiterService {
  constructor(private readonly redis: Redis) {}

  async isAllowed(
    key: string,
    maxAttempts: number,
    windowMs: number,
  ): Promise<boolean> {
    try {
      const redisKey = `${KEY_PREFIX}${key}`;
      const count = await this.redis.incr(redisKey);

      if (count === 1) {
        await this.redis.pexpire(redisKey, windowMs);
      }

      return count <= maxAttempts;
    } catch (err) {
      logger.error({ err }, "[Redis] Rate limiter check failed, allowing request");
      return true;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await this.redis.del(`${KEY_PREFIX}${key}`);
    } catch (err) {
      logger.error({ err }, "[Redis] Rate limiter reset failed");
    }
  }
}
