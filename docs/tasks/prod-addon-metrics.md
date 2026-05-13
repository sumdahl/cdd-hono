# Production Add-on: Metrics

## Metadata
- **Priority:** Low
- **Status:** Pending
- **Estimated time:** ~1h
- **Dependencies:** None

## Problem

No observability. Can't answer: QPS, error rate, p99 latency, endpoint usage. Debugging perf regressions requires guesswork.

## Solution: Prometheus endpoint

```bash
bun add prom-client
```

### 1. Metrics registry

```typescript
// infrastructure/metrics/index.ts
import { Counter, Histogram, Registry } from "prom-client";

export const registry = new Registry();

export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in ms",
  labelNames: ["method", "path"],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500],
  registers: [registry],
});

export const dbQueryDuration = new Histogram({
  name: "db_query_duration_ms",
  help: "Database query duration in ms",
  labelNames: ["operation"],
  buckets: [1, 5, 10, 25, 50, 100, 250],
  registers: [registry],
});
```

### 2. Middleware: count + time every request

```typescript
// infrastructure/http/middleware/metrics.ts
import { createMiddleware } from "hono/factory";
import { httpRequestsTotal, httpRequestDuration } from "../../metrics";

export const metricsMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const path = c.req.path.replace(/\/[a-f0-9-]{36}/g, "/:id"); // normalize UUIDs
  httpRequestsTotal.inc({ method: c.req.method, path, status: c.res.status });
  httpRequestDuration.observe({ method: c.req.method, path }, duration);
});
```

### 3. Track DB query duration in withDbError

```typescript
// infrastructure/db/with-db-error.ts
import { dbQueryDuration } from "../metrics";

export async function withDbError<T>(operation: string, fn: () => Promise<T>, ...) {
  const start = Date.now();
  try {
    return await fn();
  } catch (err) {
    // ...
  } finally {
    dbQueryDuration.observe({ operation }, Date.now() - start);
  }
}
```

### 4. Metrics endpoint

```typescript
// infrastructure/http/metrics/metrics.routes.ts
import { registry } from "../../metrics";

const router = createAppRouter();
router.get("/metrics", async (c) => {
  c.header("Content-Type", registry.contentType);
  return c.body(await registry.metrics());
});
```

Mount unprotected at `GET /metrics` (or protect with admin auth in production).

### 5. Wire in server/index.ts

```typescript
app.use("*", metricsMiddleware);
app.route("/metrics", metricsRouter);
```

### 6. Grafana dashboard (optional)

```json
{
  "dashboard": {
    "title": "API Overview",
    "panels": [
      { "title": "QPS", "targets": [{ "expr": "rate(http_requests_total[1m])" }] },
      { "title": "P99 Latency", "targets": [{ "expr": "histogram_quantile(0.99, rate(http_request_duration_ms_bucket[5m]))" }] },
      { "title": "Error Rate", "targets": [{ "expr": "rate(http_requests_total{status=~'5..'}[5m])" }] },
      { "title": "DB Query Duration", "targets": [{ "expr": "rate(db_query_duration_ms_sum[1m]) / rate(db_query_duration_ms_count[1m])" }] },
    ]
  }
}
```

### Test approach

- Unit test middleware: assert counters incremented after request
- Unit test withDbError: assert dbQueryDuration recorded
- Assert /metrics endpoint returns prometheus text format

## Acceptance Criteria

- [ ] `GET /metrics` returns Prometheus-formatted metrics
- [ ] Request count (by method + path + status) tracked
- [ ] Request duration (histogram) tracked
- [ ] DB query duration (by operation) tracked
- [ ] UUIDs normalized to `:id` in path labels to prevent cardinality explosion
- [ ] `bun test` passes
