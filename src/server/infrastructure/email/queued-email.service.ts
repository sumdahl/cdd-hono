import { IEmailService } from "../../core/services/email.service";
import { emailQueue } from "../queue";
import { logger } from "../logger";

export class QueuedEmailService implements IEmailService {
  async sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
    await emailQueue.add(
      "send-verification",
      { type: "send-verification", to, name, token },
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } },
    );
    logger.info({ to }, "[EmailQueue] Enqueued verification email");
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
    await emailQueue.add(
      "send-password-reset",
      { type: "send-password-reset", to, name, token },
      { removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } },
    );
    logger.info({ to }, "[EmailQueue] Enqueued password reset email");
  }
}
