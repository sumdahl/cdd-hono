import "./server/config/env";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { app } from "./server";
import { env } from "./server/config/env";

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

const root = new Hono();

root.get("/openapi.json", (c) => c.json(openApiDoc));
root.get("/docs", swaggerUI({ url: "/openapi.json" }));
root.route("/", app);

export default {
  port: env.PORT,
  fetch: root.fetch,
};
