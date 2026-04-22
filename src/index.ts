import "./server/config/env";
import { swaggerUI } from "@hono/swagger-ui";
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
      url: `http://localhost:${env.PORT}/api/v1`,
      description: "Local development server",
    },
  ],
});

app.get("/openapi.json", (c) => c.json(openApiDoc));
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

export default {
  port: env.PORT,
  fetch: app.fetch,
};
