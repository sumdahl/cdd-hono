import "./server/config/env";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { app } from "./server";
import { env } from "./server/config/env";
import { errorHandler } from "./server/infrastructure/http/middleware/error-handler";
import { emailWorker } from "./server/infrastructure/queue/email.worker";
import { queueConnection, emailQueue } from "./server/infrastructure/queue";

const openApiDoc = app.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Contract-Driven API",
    version: "1.0.0",
    description: "Contract-driven API development with Hono, Bun, and OpenAPI",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`, // was /api/v1
      description: "Local development server",
    },
  ],
});

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

const root = new Hono();

root.get("/openapi.json", (c) => c.json(openApiDoc));
root.get("/docs", swaggerUI({ url: "/openapi.json" }));
root.route("/", app);
root.onError(errorHandler);

const gracefulShutdown = async () => {
  await emailWorker.close();
  await emailQueue.close();
  await queueConnection.quit();
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

export default {
  port: env.PORT,
  fetch: root.fetch,
};
