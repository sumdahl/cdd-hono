# Production Add-on: Background Jobs

## Metadata
- **Priority:** Medium
- **Status:** Pending
- **Estimated time:** ~3h
- **Dependencies:** None (Redis already wired)

## Problem

Email sending blocks the req/res cycle. Verification emails, password resets, welcome emails all run inline. If Resend is slow or down, the API response waits or the send is fire-and-forget (lost on failure). No retry, no observability.

## Solution: BullMQ job queue

```bash
bun add bullmq
```

### 1. Queue schema

Jobs grouped by type:

```typescript
// infrastructure/queue/index.ts
import { Queue, Worker, Job } from "bullmq";
import { redis } from "../redis";

export const emailQueue = new Queue("email", { connection: redis });

export type EmailJobData =
  | { type: "send-verification"; to: string; name: string; token: string }
  | { type: "send-password-reset"; to: string; name: string; token: string };

export async function enqueueEmail(data: EmailJobData): Promise<void> {
  await emailQueue.add(data.type, data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });
}
```

### 2. Worker

```typescript
// infrastructure/queue/email.worker.ts
import { Worker } from "bullmq";
import { redis } from "../redis";
import { ResendEmailService } from "../email/resend.email.service";
import { logger } from "../logger";

const emailService = new ResendEmailService();

export const emailWorker = new Worker("email", async (job) => {
  const { data } = job;
  switch (data.type) {
    case "send-verification":
      await emailService.sendVerificationEmail(data.to, data.name, data.token);
      break;
    case "send-password-reset":
      await emailService.sendPasswordResetEmail(data.to, data.name, data.token);
      break;
  }
}, { connection: redis });

emailWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id }, "Email job failed");
});
```

### 3. Replace inline sends with enqueue

In use-cases (register, forgot-password, resend-verification):

```typescript
// Before:
await this.emailService.sendVerificationEmail(user.email, user.name, token);

// After:
await enqueueEmail({ type: "send-verification", to: user.email, name: user.name, token });
```

Change `IEmailService` dependency to `IEmailQueue` or inject queue directly. Cleaner: wrap queue behind an interface.

```typescript
// core/services/email-queue.service.ts
export interface IEmailQueue {
  enqueue(data: EmailJobData): Promise<void>;
}
```

```typescript
// infrastructure/queue/bull-mq-email-queue.service.ts
export class BullMqEmailQueue implements IEmailQueue {
  async enqueue(data: EmailJobData) {
    await enqueueEmail(data);
  }
}
```

### 4. Start worker on boot

```typescript
// src/index.ts or server/index.ts
import { emailWorker } from "./infrastructure/queue/email.worker";

// Worker auto-starts — keep process alive
process.on("SIGTERM", async () => {
  await emailWorker.close();
});
```

### 5. Env vars

Add to `env.ts`:

```
REDIS_URL=redis://localhost:6379  (already exists)
```

### 6. Periodic cleanup job (optional)

Add a second worker for expired token cleanup:

```typescript
export const cleanupWorker = new Worker("cleanup", async (job) => {
  // Delete expired verification tokens
  // Delete expired password reset tokens
  // Delete expired refresh tokens
}, { connection: redis });

// Schedule via cron in a separate script or use bullmq's repeatable jobs
await cleanupQueue.add("cleanup-expired-tokens", {}, {
  repeat: { pattern: "0 */6 * * *" }, // every 6 hours
});
```

### Test approach

- Mock `IEmailQueue` — assert `enqueue` called with correct data
- Integration: start worker with in-memory Redis, assert email eventually sent
- Use `bun:test` timeouts generous enough for async job completion

## Acceptance Criteria

- [ ] BullMQ queue + worker for email jobs
- [ ] 3 retries with exponential backoff on failure
- [ ] Use-cases enqueue instead of calling email service directly
- [ ] Worker starts on boot, graceful shutdown on SIGTERM
- [ ] Logger captures job failures
- [ ] `bun test` passes
