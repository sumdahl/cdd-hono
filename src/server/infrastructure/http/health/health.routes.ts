import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";

export const healthRouter = new OpenAPIHono();

const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  description: "Health check endpoint",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.enum(["ok"]),
            uptime: z.number(),
            timestamp: z.string(),
          }),
        },
      },
      description: "Service is healthy",
    },
  },
});

healthRouter.openapi(healthRoute, (c) => {
  return c.json({
    status: "ok" as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
