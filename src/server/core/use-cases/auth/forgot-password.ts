import { IUserRepository } from "../../repositories/user.repository";
import { IPasswordResetTokenRepository } from "../../repositories/password-reset-token.repository";
import { IEmailService } from "../../services/email.service";
import { IRateLimiterService } from "../../services/rate-limiter.service";
import { AppError, ErrorCode } from "../../errors";
import crypto from "crypto";

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly emailService: IEmailService,
    private readonly rateLimiterService: IRateLimiterService,
  ) {}

  async execute(email: string): Promise<void> {
    const allowed = await this.rateLimiterService.isAllowed(
      `forgot-password:${email}`,
      3,
      60 * 60 * 1000,
    );

    if (!allowed) {
      throw new AppError(
        ErrorCode.TOO_MANY_REQUESTS,
        "Too many password reset attempts. Please try again later.",
        429,
      );
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isVerified) return;

    await this.passwordResetTokenRepository.deleteAllForUser(user.id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.passwordResetTokenRepository.save(user.id, token, expiresAt);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, user.name, token);
    } catch (err) {
      console.error(
        "[ForgotPasswordUseCase] Failed to send password reset email to:",
        user.email,
        err,
      );
    }
  }
}
