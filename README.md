# contract-driven-api-development

Production-grade REST API boilerplate following Clean Architecture and contract-driven development principles.

## Features
- ✅ Bun runtime + Hono web framework
- ✅ Drizzle ORM with PostgreSQL
- ✅ Zod schema validation + auto-generated OpenAPI/Swagger
- ✅ JWT authentication (access + refresh tokens)
- ✅ Fully decoupled business logic from infrastructure
- ✅ Unit + integration test suite

## Architecture
Clean Architecture with strict dependency rule: core layer never imports infrastructure. Swap databases or frameworks without changing business logic.
```
src/server/
├── core/               # Entities, repository interfaces, use cases
└── infrastructure/     # DB client, schemas, HTTP routes, middleware
```

## API Endpoints
```
# Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me       ← protected

# Public
GET    /api/v1/health
GET    /docs                 ← Swagger UI
GET    /openapi.json
```

## Getting Started
**Prerequisites:** Bun, Docker

```bash
git clone https://github.com/sumdahl/trpc-cdd
cd contract-driven-api-development

bun install
cp .env.example .env

docker compose up -d
bun db:generate
bun db:migrate

bun dev
```

## Scripts
```bash
bun dev              # Development watch mode
bun start            # Production start
bun test             # Run all tests
bun test --coverage  # Coverage report
bun db:studio        # Drizzle Studio
bun build            # Production build
```

## Environment Variables
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cdd
PORT=8000
NODE_ENV=development
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Tests
23 passing tests across 9 files:
- **Unit:** Pure business logic for auth and todos use cases
- **Integration:** Full HTTP request flow validation

## License

ISC
