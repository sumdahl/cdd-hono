---
name: feature-workflow
description: Project rules for building features - branch strategy, architecture compliance, testing, and commit workflow. Use when starting a new feature, enhancement, or bug fix, or when asked about development workflow.
---

# Feature Workflow Rules

## Before Starting Any Feature

### 1. Branch Strategy

```
1. git checkout main
2. git pull origin main
3. git checkout -b feat/<feature-name>
```

**Never** work directly on main or existing feature branches.

### 2. Architecture Compliance

This project uses clean architecture:

```
src/server/
├── core/                    # Business logic (entities, use-cases, services, repositories interfaces)
│   ├── entities/
│   ├── use-cases/
│   ├── services/
│   ├── repositories/
│   └── shared/
├── infrastructure/         # External concerns (HTTP, DB, Redis, Email)
│   ├── http/
│   │   ├── middleware/
│   │   ├── shared/
│   │   └── response/
│   ├── persistence/        # DB repositories
│   ├── services/
│   ├── di/                  # Dependency injection
│   └── config/
└── config/
```

**Rule**: New code must live in the correct layer. Use existing files in same layer as reference.

### 3. Skill Combination

Combine relevant skills for productivity:

- Drizzle patterns → schema/DB work
- OpenAPI-CDD → API contracts
- Auth-tokens → auth flows
- TDD → test-first development
- Improve-codebase-architecture → refactoring decisions

### 4. Lint → Test → Types

Run lint before test. Catch style issues early.

- Check package.json for lint cmd (e.g., `npm run lint`)
- Then run `bun test`

### 5. API Changes? Export Spec

If route/contract modified:
- Run `npm run export:spec`
- Commit includes OpenAPI updates

### 6. Pre-Commit Checklist

- [ ] Lint passes
- [ ] `bun test` passes
- [ ] Type check passes (`bun tsc` or package.json check)

### 7. Commit Workflow

1. Stage: `git add .`
2. Commit: `git commit -m "feat: description (closes #123)"`
3. Push: Owner handles manually

Format: `feat/fix/refactor/chore/test: description`

Reference issue numbers in parens.