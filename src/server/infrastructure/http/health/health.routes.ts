import { createRoute, z } from "@hono/zod-openapi";
import { createAppRouter } from "../shared/create-router";
import { IHealthCheckService } from "../../../core/services/health-check.service";

const healthSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  uptime: z.number(),
  timestamp: z.string(),
  services: z.object({
    database: z.object({
      status: z.enum(["ok", "error"]),
      latencyMs: z.number().optional(),
      error: z.string().optional(),
    }),
  }),
});

const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  description: "Deep health check — verifies DB connectivity",
  responses: {
    200: {
      content: { "application/json": { schema: healthSchema } },
      description: "Service is healthy",
    },
    503: {
      content: { "application/json": { schema: healthSchema } },
      description: "Service is degraded",
    },
  },
});

export type HealthRouterDeps = {
  healthCheckService: IHealthCheckService;
};

export function createHealthRouter(deps: HealthRouterDeps) {
  const router = createAppRouter();
  const { healthCheckService } = deps;

  router.openapi(healthRoute, async (c) => {
    const result = await healthCheckService.check();
    const httpStatus = result.status === "ok" ? 200 : 503;

    return c.json(
      {
        status: result.status,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: result.status === "ok" ? "ok" : "error",
            latencyMs: result.latencyMs,
          },
        },
      },
      httpStatus,
    );
  });

  return router;
}
