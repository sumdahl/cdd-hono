import { Worker } from "bullmq";
import { ResendEmailService } from "../email/resend.email.service";
import { logger } from "../logger";
import { queueConnection } from "./index";
import type { EmailJobData } from "./index";

const emailService = new ResendEmailService();

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job) => {
    const { data } = job;
    switch (data.type) {
      case "send-verification": {
        await emailService.sendVerificationEmail(data.to, data.name, data.token);
        break;
      }
      case "send-password-reset": {
        await emailService.sendPasswordResetEmail(data.to, data.name, data.token);
        break;
      }
    }
  },
  { connection: queueConnection },
);

emailWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, type: job.data.type }, "[EmailWorker] Job completed");
});

emailWorker.on("failed", (job, err) => {
  logger.error({ err, jobId: job?.id, type: job?.data?.type }, "[EmailWorker] Job failed");
});
