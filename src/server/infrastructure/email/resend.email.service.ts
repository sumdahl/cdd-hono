import { Resend } from "resend";
import { IEmailService } from "../../core/services/email.service";
import { AppError, ErrorCode } from "../../core/errors";
import { env } from "../../config/env";
import { verificationEmailTemplate } from "./templates/verification.template";
import { passwordResetEmailTemplate } from "./templates/password-reset.template";

export class ResendEmailService implements IEmailService {
  private readonly client: Resend;

  constructor() {
    this.client = new Resend(env.RESEND_KEY);
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${env.APP_URL}/api/v1/auth/verify-email?token=${token}`;

    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Verify your email address",
      html: verificationEmailTemplate(name, verificationUrl),
    });

    if (error) {
      console.error("[EMAIL] sendVerificationEmail failed:", error);
      throw new AppError(
        ErrorCode.EMAIL_SEND_FAILED,
        "Failed to send verification email",
        500,
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${env.APP_URL}/api/v1/auth/reset-password?token=${token}`;

    const { error } = await this.client.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: "Reset your password",
      html: passwordResetEmailTemplate(name, resetUrl),
    });

    if (error) {
      console.error("[EMAIL] sendPasswordResetEmail failed:", error);
      throw new AppError(
        ErrorCode.EMAIL_SEND_FAILED,
        "Failed to send password reset email",
        500,
      );
    }
  }
}
