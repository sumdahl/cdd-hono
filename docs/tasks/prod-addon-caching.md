# Production Add-on: Caching

## Metadata
- **Priority:** Low
- **Status:** Pending
- **Estimated time:** ~1.5h
- **Dependencies:** Redis already wired

## Problem

Every request hits DB. No caching for frequently accessed data (user profiles, roles, permissions). Redis is configured but unused.

## Solution: Cache-aside decorator

### 1. Cache service interface

```typescript
// core/services/cache.service.ts
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<void>;  // for invalidation by prefix
}
```

### 2. Redis implementation

```typescript
// infrastructure/services/redis-cache.service.ts
export class RedisCacheService implements ICacheService {
  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    return raw ? JSON.parse(raw) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
```

### 3. Decorator for use-cases

Use a simple HOF for read use-cases:

```typescript
// infrastructure/services/cache-decorator.ts
import { ICacheService } from "../../core/services/cache.service";

export function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
  cache: ICacheService,
): Promise<T> {
  return (async () => {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;
    const result = await fn();
    await cache.set(key, result, ttlSeconds);
    return result;
  })();
}
```

### 4. Usage in route handlers

```typescript
// Before:
const user = await meUseCase.execute(userId);

// After:
const user = await withCache(`user:${userId}`, 300, () => meUseCase.execute(userId), cacheService);
```

Or push caching into the use-case layer via DI — use-cases accept optional `ICacheService`:

```typescript
export class GetUserByIdUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly cache?: ICacheService,  // optional — no cache in unit tests
  ) {}
}
```

### 5. Invalidation

Cache invalidation is the hard part. Strategy:

| Data | Cache key | TTL | Invalidate on |
|------|-----------|-----|---------------|
| User profile | `user:{id}` | 5 min | Profile update |
| User roles | `user:{id}:roles` | 5 min | Role assign/remove |
| Permissions | `perms:{roleIds}` | 10 min | Permission change |
| Role list | `roles:all` | 10 min | Role create/delete |

Pass invalidation callbacks into write use-cases or handle at the route layer:

```typescript
// After role assignment:
await assignRoleUseCase.execute(userId, role);
await cacheService.del(`user:${userId}:roles`);
await cacheService.del(`user:${userId}`);  // profile includes roles
```

### 6. Wire in container

```typescript
// container.ts
cacheService: asClass(RedisCacheService).singleton(),
```

Route handlers or use-cases that use cache inject via constructor.

### Test approach

- `InMemoryCacheService` — `Map<string, { value: T; ttl: number }>`
- Test cache hit: assert fn NOT called, cache value returned
- Test cache miss: assert fn called, value stored
- Test invalidation: assert cache cleared after write
- Use `vi.useFakeTimers()` or manual TTL management for expiry tests

## Acceptance Criteria

- [ ] `ICacheService` in core with get/set/del/delPattern
- [ ] `RedisCacheService` storing JSON with TTL
- [ ] Cache decorator or optional DI in read use-cases
- [ ] Invalidation triggered on relevant write operations
- [ ] `bun test` passes
