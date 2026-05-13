import "../../../../src/server/config/env";
import { Redis } from "ioredis";
import { env } from "../../../../src/server/config/env";

const url = new URL(env.REDIS_URL);
const redis = new Redis({ host: url.hostname, port: Number(url.port) || 6379 });

async function main() {
  const keys = await redis.keys("ratelimit:*");
  if (keys.length > 0) {
    await redis.del(...keys);
    console.error(`Reset ${keys.length} rate limiter keys`);
  }
  redis.disconnect();
}

main();
