---
name: auth-tokens
description: Authentication token flows - JWT access/refresh tokens, verification tokens, password reset tokens, and token blacklisting. Use when implementing auth, token refresh, email verification, password reset, or logout with token invalidation.
---

# Auth Token Flows

## Token Types

| Token | Purpose | Storage | TTL |
|-------|---------|---------|-----|
| Access Token | API authorization | Client (memory/cookie) | 15 min |
| Refresh Token | Get new access tokens | DB + client cookie | 7 days |
| Verification Token | Email verification | DB | 24 hours |
| Password Reset Token | Password reset | DB | 1 hour |

## Token Services

### TokenService (`src/server/core/services/token.service.ts`)

```typescript
interface ITokenService {
  generateAccessToken(user: { userId: string; email: string; roles: string[] }): Promise<string>;
  generateRefreshToken(user: { userId: string; email: string }): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<{ userId: string }>;
}
```

### TokenBlacklistService (`src/server/core/services/token-blacklist.service.ts`)

```typescript
interface ITokenBlacklistService {
  blacklist(jti: string, ttlSeconds: number): Promise<void>;
  isBlacklisted(jti: string): Promise<boolean>;
}
```

## Login Flow

1. Validate credentials with bcrypt
2. Check `user.isVerified`
3. Fetch user roles
4. Generate access + refresh token
5. Store refresh token in DB with expiry
6. Return tokens to client

See [login.ts](login.ts) for implementation.

## Refresh Flow

1. Receive refresh token
2. Lookup in DB (verify exists)
3. Check expiry (delete if expired)
4. Verify JWT signature
5. Fetch user
6. Delete old refresh token (rotation)
7. Generate new access + refresh token
8. Store new refresh token in DB

See [refresh.ts](refresh.ts) for implementation.

## Email Verification

1. User registers → create verification token in DB
2. Send email with verification link
3. User clicks link → verify token exists and not expired
4. Mark user as verified, delete token

See [verify-email.ts](verify-email.ts), [resend-verification.ts](resend-verification.ts).

## Password Reset

1. User requests reset (rate limited: 3/hour per email)
2. Delete existing tokens for user
3. Generate token, store in DB with 1hr expiry
4. Send email asynchronously

See [forgot-password.ts](forgot-password.ts), [reset-password.ts](reset-password.ts).

## Logout

1. Delete refresh token from DB (invalidates refresh)
2. Blacklist access token JWT `jti` in Redis
3. Client discards tokens

## Key Patterns

- **Token rotation**: Refresh tokens are deleted and recreated on each use (prevents reuse attacks)
- **DB validation**: Refresh tokens are validated against DB, not just JWT signature
- **Rate limiting**: Password reset is rate-limited to prevent abuse
- **Silent failures**: Forgot-password returns success even if email not found (prevents enumeration)