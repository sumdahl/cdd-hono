# contract-driven-api-development

Production-grade REST API boilerplate built with Clean (Hexagonal) Architecture and contract-driven development principles. Auth is fully implemented as the reference domain — add new features by following the same pattern.

## Stack

- **Runtime:** Bun
- **Framework:** Hono + @hono/zod-openapi
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod (schema-first, drives OpenAPI contract)
- **Auth:** JWT access + refresh tokens with rotation
- **DI:** Awilix (CLASSIC injection mode)
- **Tests:** Bun test runner

## Features

-  Hexagonal architecture — core never imports infrastructure
-  Contract-first OpenAPI — routes defined from Zod schemas, spec auto-generated
-  JWT auth — access token + refresh token rotation
-  Typed error codes — `ErrorCode` const map, no raw strings
-  Centralized error handling — `AppError` domain errors, graceful HTTP responses
-  Awilix DI container — single composition root, fully typed `Cradle`
-  Request ID — every request tagged, logged, and returned as `X-Request-Id`
-  Deep health check — verifies DB connectivity, returns latency + `503` on failure
-  Versioned OpenAPI spec export — `bun run export:spec`
-  Unit + integration test suite — in-memory repositories, no DB required for tests

## Architecture

Strict dependency rule: **core layer never imports infrastructure**. Swap databases, frameworks, or ORMs without touching business logic.

```
src/
├── index.ts                        ← entrypoint, Swagger UI, spec serving
└── server/
    ├── config/env.ts               ← Zod-validated env vars, hard exit on failure
    ├── core/                       ← pure domain, zero infrastructure imports
    │   ├── errors.ts               ← AppError class + ErrorCode const map
    │   ├── entities/               ← domain entities
    │   ├── repositories/           ← repository interfaces (IUserRepository, ITokenRepository)
    │   └── use-cases/              ← one file per use-case
    └── infrastructure/
        ├── db/                     ← Drizzle client
        ├── di/                     ← Awilix container + Cradle types
        ├── persistence/            ← Postgres repository implementations + Drizzle schemas
        └── http/
            ├── shared/             ← createAppRouter() with centralized defaultHook
            ├── middleware/         ← cors, logger (request ID), error-handler, rate-limiter, auth
            ├── response/           ← formatSuccess, formatError, response types + schemas
            ├── health/             ← deep health check route
            └── auth/               ← auth routes, schemas, DI wiring
```

## Adding a New Domain

Every new feature follows the same pattern:

```
1. core/entities/               → define the entity
2. core/repositories/           → define the repository interface
3. core/use-cases/              → one file per use-case
4. infrastructure/persistence/  → implement the repository + Drizzle schema
5. infrastructure/http/         → define routes + schemas
6. infrastructure/di/           → register in container.ts + types.ts
```

## API Endpoints

```
# Auth
POST   /api/v1/auth/register    → 201 | 409 | 422
POST   /api/v1/auth/login       → 200 | 401 | 422
POST   /api/v1/auth/refresh     → 200 | 401 | 422
POST   /api/v1/auth/logout      → 200 | 401 | 422
GET    /api/v1/auth/me          → 200 | 401          ← protected

# Public
GET    /api/v1/health           → 200 | 503
GET    /docs                    ← Swagger UI
GET    /openapi.json            ← OpenAPI spec (runtime)
```

## Getting Started

**Prerequisites:** Bun, Docker

```bash
git clone https://github.com/sumdahl/contract-driven-api-development
cd contract-driven-api-development
bun install
cp .env.example .env        # fill in JWT secrets
docker compose up -d
bun db:generate
bun db:migrate
bun dev
```

Swagger UI available at `http://localhost:8000/docs`.

## Scripts

```bash
bun dev              # Development watch mode
bun start            # Production start
bun build            # Production build
bun test             # Run all tests
bun run export:spec  # Export versioned OpenAPI spec to specs/
bun db:generate      # Generate Drizzle migrations
bun db:migrate       # Run migrations
bun db:studio        # Drizzle Studio
```

## Environment Variables

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cdd
PORT=8000
NODE_ENV=development
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Tests

16 passing tests across 6 files:

- **Unit:** Pure business logic, no DB — register, login, logout, refresh, me
- **Integration:** Full HTTP request/response flow using in-memory repositories

```bash
bun test
bun test --coverage
```

## Response Format

All endpoints return a consistent envelope:

```json
// success
{ "success": true, "data": {}, "message": "..." }

// error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": [] } }
```

## License

ISC
