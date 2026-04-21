import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";
import { appRouter } from "./server";
import { createContext } from "./server/context";
import fs from "fs/promises";

const app = express();
const PORT = 8000;

app.use(express.json());

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "Contract-Driven API Development with tRPC and OpenAPI",
  version: "1.0.0",
  baseUrl: "http://localhost:8000/api",
});

fs.writeFile("./openapi-specs.json", JSON.stringify(openApiDocument, null, 2));

app.get("/openapi.json", (_, res) => {
  return res.json(openApiDocument);
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
