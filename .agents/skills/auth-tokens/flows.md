# Auth Token Flows Reference

## Access Token (JWT)

```
Payload:
{
  "userId": "usr_xxx",
  "email": "user@example.com",
  "roles": ["admin", "user"],
  "jti": "unique-id",
  "iat": 1234567890,
  "exp": 1234568790  // 15 min
}
```

## Refresh Token Flow

```
┌─────────┐    1. Send refresh token    ┌─────────┐
│  Client  │ ──────────────────────────→ │   API   │
└─────────┘                              └────┬────┘
                                               │
                                               ▼
                                      ┌────────────────┐
                                      │ DB: find(token)│
                                      └───────┬────────┘
                                              │
                                         ┌────┴────┐
                                         │ exists? │
                                         └────┬────┘
                                    ┌────────┴────────┐
                                    ▼                 ▼
                               [NO]               [YES]
                               delete              check expiry
                                    │                 │
                                    ▼                 ▼
                               401 error         ┌────┴────┐
                                                 │expired? │
                                                 └────┬────┘
                                           ┌────────┴────────┐
                                           ▼                 ▼
                                      [YES]              [NO]
                                      delete            verify JWT
                                           │                 │
                                           ▼                 ▼
                                      401 error         fetch user
                                                          │
                                                          ▼
                                                   delete old token
                                                          │
                                                          ▼
                                                   generate new pair
                                                          │
                                                          ▼
                                                   store refresh token
                                                          │
                                                          ▼
                                              ┌─────────────────┐
                                              │  Return tokens   │
                                              └────────┬────────┘
                                                       │
                                                       ▼
                                              ┌─────────────┐
                                              │   200 OK     │
                                              │ { access,    │
                                              │  refresh }   │
                                              └─────────────┘
```

## Verification Token Flow

```
1. Register → create user (isVerified=false)
2. Create verification_token (expires 24h)
3. Send email with link: /verify?token=xxx

4. User clicks link
5. Lookup token in DB
6. If not found → 400 "Invalid token"
7. If expired → delete token, 400 "Token expired"
8. Find user, if already verified → 409 "Already verified"
9. Mark user.isVerified = true
10. Delete token
11. Return 200 "Email verified"
```

## Password Reset Flow

```
1. POST /forgot-password { email }
2. Rate limit check: 3 requests per hour per email
3. If over limit → 429 "Too many requests"
4. Lookup user by email
5. If not found or !isVerified → return success (silent fail!)
6. Delete existing password_reset_tokens for user
7. Generate token (crypto.randomBytes 32 hex)
8. Store in DB (expires 1 hour)
9. Send email (async, don't await)
10. Return 200 (always, even if user not found)

11. User clicks link in email
12. POST /reset-password { token, newPassword }
13. Lookup token in DB
14. If not found → 400 "Invalid token"
15. If expired → delete token, 400 "Token expired"
16. Find user by userId from token
17. Update password (bcrypt hash)
18. Delete token
19. Return 200 "Password reset successful"
```

## Error Codes

| Code | Usage |
|------|-------|
| INVALID_TOKEN | Token not found in DB |
| TOKEN_EXPIRED | Token expired |
| INVALID_CREDENTIALS | Wrong email/password |
| EMAIL_NOT_VERIFIED | User not verified |
| EMAIL_ALREADY_VERIFIED | Already verified |
| VERIFICATION_TOKEN_INVALID | Invalid/used token |
| VERIFICATION_TOKEN_EXPIRED | Expired verification token |