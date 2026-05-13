# Fix Email Fire-and-Forget Anti-Pattern

## Metadata
- **Priority:** High
- **Status:** Done
- **Dependencies:** Recommended to complete `add-unit-of-work-pattern.md` first for full transactional safety

## Problem
Email sending in use cases uses fire-and-forget with only a `.catch` log:

```typescript
this.emailService.sendVerificationEmail(...).catch((err) => {
  console.error('Failed to send verification email', err);
});
```

This means:
- User is created (or password reset token is saved) even when email fails
- User never receives the verification/reset email
- Account becomes unverifiable — permanently stuck
- Errors are swallowed silently into `console.error` (not the structured logger)

## Affected Use Cases
- `src/server/core/use-cases/auth/register.ts` — verification email
- `src/server/core/use-cases/auth/forgot-password.ts` — password reset email
- `src/server/core/use-cases/auth/resend-verification.ts` — resend verification email

## Recommended Solution: Synchronous with Proper Error Propagation

Make email sending `await`ed and let failures propagate as `AppError`:

**Pros:** Simple, no new infrastructure, immediate feedback to user
**Cons:** If email provider is slow, request latency increases; no retry on transient failure

**Implementation:**
- `await this.emailService.sendVerificationEmail(...)`
- Wrap in try/catch; on failure throw `new AppError(ErrorCode.EMAIL_SEND_FAILED, "...", 503)`
- Use structured logger (`logger.error`) not `console.error`

## Alternative Solution: Transactional Outbox Pattern

**Pros:** Fully decoupled, retries, survives email service downtime, best for production
**Cons:** Requires new DB table, background worker, significantly more infrastructure

**Implementation outline:**
1. New `email_outbox` table: `id`, `to`, `subject`, `body`, `status`, `attempts`, `createdAt`, `processedAt`
2. `IOutboxRepository` in `core/repositories/`
3. `PostgresOutboxRepository` in `infrastructure/persistence/`
4. Use cases save to outbox (in same transaction as domain write via Unit of Work)
5. Background `OutboxWorker` polls, sends, marks as sent/failed with exponential backoff
6. Register worker in DI container, start on app boot

> **Recommendation:** Start with the synchronous approach for immediate correctness. Implement the outbox pattern as a follow-up once the Unit of Work pattern is in place — it requires transactional writes to work properly anyway.

## Acceptance Criteria
- [ ] No fire-and-forget `.catch()` email calls remain in any use case
- [ ] Email failures surface as proper `AppError` with `ErrorCode.EMAIL_SEND_FAILED`
- [ ] Structured logger (`logger.error`) used instead of `console.error`
- [ ] Unit tests cover email failure scenarios
- [ ] `bun run build` passes
- [ ] `bun test` passes with no regressions
