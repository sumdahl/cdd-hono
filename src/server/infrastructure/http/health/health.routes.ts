import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { createAppRouter } from "../shared/create-router";

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

export const healthRouter = createAppRouter();

healthRouter.openapi(healthRoute, async (c) => {
  const start = Date.now();
  let dbStatus: "ok" | "error" = "ok";
  let dbLatency: number | undefined;
  let dbError: string | undefined;

  try {
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - start;
  } catch (err) {
    dbStatus = "error";
    dbError = err instanceof Error ? err.message : "Unknown DB error";
  }

  const status = dbStatus === "ok" ? "ok" : "degraded";
  const httpStatus = status === "ok" ? 200 : 503;

  return c.json(
    {
      status,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          ...(dbLatency !== undefined && { latencyMs: dbLatency }),
          ...(dbError !== undefined && { error: dbError }),
        },
      },
    },
    httpStatus,
  );
});
