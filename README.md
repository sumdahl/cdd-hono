# Contract-Driven API Development

Demonstration of contract-driven API development using tRPC for type-safe endpoints with automatic OpenAPI specification generation.

## Table of Contents

- [About](#about)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## About

This project showcases modern contract-driven API development patterns where API contracts are defined once in TypeScript using Zod schemas, and automatically used to generate:
- Fully type-safe tRPC endpoints
- Validated REST API endpoints
- Complete OpenAPI 3.0 specification
- Runtime input validation

Built with Node.js, Express, tRPC, Zod, and `trpc-to-openapi`.

## Features

 **Single Source of Truth** - Define schemas once, use everywhere  
 **Type Safety** - End-to-end TypeScript safety for all API operations  
 **Automatic Documentation** - OpenAPI spec generated at runtime from tRPC routers  
 **Dual API Support** - Both tRPC and REST endpoints available  
 **Runtime Validation** - Zod ensures all incoming request data matches schema  
 **Extensible Architecture** - Clean router composition pattern for adding new endpoints  

## Prerequisites

- Node.js 18+
- pnpm 8+

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd contract-driven-api-development
```

2. Install dependencies:
```bash
pnpm install
```

## Usage

Start the development server:
```bash
pnpm run dev
```

The server will start on `http://localhost:3000` with:

| Endpoint | Purpose |
|----------|---------|
| `/trpc` | tRPC HTTP endpoint |
| `/api` | REST API endpoints (auto-generated) |
| `/openapi.json` | Generated OpenAPI 3.0 specification |

The full OpenAPI specification is available at `/openapi.json` when the server is running. You can import this file into Postman, Swagger UI, or any OpenAPI-compatible tool.

## License
ISC
