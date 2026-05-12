---
name: openapi-cdd
description: Contract-driven API development using OpenAPI with Hono and Zod. Use when working with OpenAPI specs, contract-first development, generating API documentation, or writing route handlers with @hono/zod-openapi.
---

# OpenAPI Contract-Driven Development

## Philosophy

**Core principle**: Define the contract first, then implement. The OpenAPI spec is the source of truth.

Your project uses:
- `@hono/zod-openapi` for type-safe route handlers
- Zod schemas for request/response validation
- Hono for the HTTP framework

See [schema-patterns.md](schema-patterns.md) for Zod schema conventions.

## Workflow

### 1. Design the Contract

Before writing code:
- [ ] Define the route path and HTTP method
- [ ] Define request parameters, headers, body schema
- [ ] Define response status codes and body schemas
- [ ] Add OpenAPI documentation (summary, description, examples)

### 2. Generate Types

Run `npm run export:spec` to export the OpenAPI spec, then regenerate client types if needed.

### 3. Implement Route

Use `@hono/zod-openapi` handlers:

```typescript
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

const app = new OpenAPIHono()

const getUserRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Retrieves a user by their unique identifier',
  request: {
    params: z.object({
      id: z.string().openapi({ param: { in: 'path' }, example: 'usr_123' })
    })
  },
  responses: {
    200: {
      description: 'User found',
      content: {
        'application/json': {
          schema: UserSchema,
          example: { id: 'usr_123', email: 'user@example.com', name: 'John' }
        }
      }
    },
    404: ErrorResponse
  }
})

app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  const user = await getUserById(id)
  if (!user) return c.json({ error: 'Not found' }, 404)
  return c.json(user)
})

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: { title: 'My API', version: '1.0.0' }
})
```

### 4. Validate

- [ ] `npm run export:spec` produces valid OpenAPI
- [ ] Swagger UI renders at `/docs`
- [ ] Schema references are correct

## Schema Patterns

See [schema-patterns.md](schema-patterns.md) for:
- Request/response schema conventions
- Error schema patterns
- Pagination and filtering schemas
- Enum and union types