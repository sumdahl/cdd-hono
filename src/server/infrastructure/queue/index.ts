import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../../config/env";

export const queueConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue("email", {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export type EmailJobData =
  | { type: "send-verification"; to: string; name: string; token: string }
  | { type: "send-password-reset"; to: string; name: string; token: string };
