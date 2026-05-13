# Contract-Driven API Development — Domain Context

## Domain

**Identity & Access Management (IAM).** Registers users, authenticates sessions, manages roles and permissions. Single bounded context.

## Core Terms

**User** — A person with an account. Has email, name, password hash, verification status. Can have multiple roles.

**Role** — Named set of permissions (e.g. "admin", "user", "moderator"). Assigned to users.

**Permission** — Granular capability (e.g. "manage_users", "read_content"). Grouped by roles.

**Session** — Authenticated user state. Established via JWT access + refresh tokens. Carries userId, email, roles, jti.

**Access Token** — Short-lived JWT (15 min). Carries identity + roles. Used for API authorization.

**Refresh Token** — Longer-lived JWT (7 days). Stored in DB. Used to rotate access tokens. One-time use (rotation invalidates previous).

**Registration** — Creates User + assigns default role + sends verification email.

**Email Verification** — Confirms User owns the email. Required before login. Token stored in DB, expires 24h.

**Password Reset** — Replaces User's password hash. Triggered by forgot-password flow. Token stored in DB, expires 1h.

**Rate Limiting** — Per-IP, per-route. 100 req/min global, 10 req/min auth routes. Prevents brute force.

**Token Blacklist** — Revoked access token JTIs stored in Redis until natural expiry. Prevents use after logout.

## Architecture Invariants

- Core never imports infrastructure.
- Repository interfaces defined in core, implemented in infrastructure.
- Use-cases are classes with single `execute()` method.
- Every dependency injected via constructor (Awilix DI).
- In-memory adapters exist for every repository and service interface (test seam).
