import "../src/server/config/env";
import { app } from "../src/server";
import { env } from "../src/server/config/env";

const version = process.env.API_VERSION ?? "1.0.0";
const filename = `openapi-${version}.json`;

const openApiDoc = app.getOpenAPIDocument({
  openapi: "3.0.0",
  info: {
    title: "Contract-Driven API",
    version,
    description: "Contract-driven API development with Hono, Bun, and OpenAPI",
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}`, //was `http://localhost:${env.PORT}/api/v1`
      description: "Local development server",
    },
    {
      url: "https://api.yourdomain.com/api/v1",
      description: "Production server",
    },
  ],
});

const outputPath = `./specs/${filename}`;
await Bun.write(outputPath, JSON.stringify(openApiDoc, null, 2));
console.log(`OpenAPI spec exported to ${outputPath}`);
