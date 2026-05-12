# OpenAPI Schema Patterns

## Request Schemas

### Path Parameters

```typescript
const idParam = z.object({
  id: z.string().openapi({
    param: { in: 'path' as const },
    example: 'usr_123'
  })
})
```

### Query Parameters

```typescript
const queryParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().optional(),
  sort: z.enum(['asc', 'desc']).default('desc')
})
```

### Request Body

```typescript
const createUserBody = z.object({
  email: z.string().email().openapi({ example: 'user@example.com' }),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(72)
})
```

## Response Schemas

### Success Responses

```typescript
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.string().datetime()
})

const UserResponse = {
  content: {
    'application/json': {
      schema: UserSchema,
      example: { id: 'usr_123', email: 'user@example.com', name: 'John', createdAt: '2024-01-01T00:00:00Z' }
    }
  }
}
```

### Error Responses

```typescript
const ErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.any()).optional()
  })
})

const ErrorResponse = {
  description: 'Error response',
  content: { 'application/json': { schema: ErrorSchema } }
}
```

### Standard Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - validation error |
| 401 | Unauthorized - missing/invalid auth |
| 403 | Forbidden - insufficient permissions |
| 404 | Not Found - resource doesn't exist |
| 409 | Conflict - duplicate/constraint violation |
| 422 | Unprocessable - business logic error |
| 429 | Too Many Requests - rate limited |
| 500 | Internal Server Error |

## Pagination

```typescript
const PaginationParams = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
})

const PaginatedResponse = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      total: z.number().int(),
      limit: z.number().int(),
      offset: z.number().int(),
      hasMore: z.boolean()
    })
  })
```

## Enums

```typescript
const UserRoleSchema = z.enum(['admin', 'user', 'guest']).openapi({
  enum: ['admin', 'user', 'guest']
})

const StatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('pending')
]).openapi({ example: 'active' })
```

## Validation-Only Schemas

For request validation that doesn't appear in docs:

```typescript
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8)
}).strict()
```

## Conventions

1. Always add `openapi()` with examples for user-facing fields
2. Use `.openapi({ param: { in: 'path' } })` for path params
3. Document complex schemas with JSDoc or description
4. Prefer `z.coerce.number()` for query params (handles string to number)
5. Use `.default()` for optional query params