import { IUserRepository } from "../../repositories/user.repository";
import { IVerificationTokenRepository } from "../../repositories/verification-token.repository";
import { IEmailService } from "../../services/email.service";
import { AppError, ErrorCode } from "../../errors";
import crypto from "crypto";

export class ResendVerificationUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    if (user.isVerified) {
      throw new AppError(
        ErrorCode.EMAIL_ALREADY_VERIFIED,
        "Email already verified",
        409,
      );
    }

    await this.verificationTokenRepository.deleteAllForUser(user.id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.verificationTokenRepository.save(user.id, token, expiresAt);

    await this.emailService.sendVerificationEmail(user.email, user.name, token);
  }
}
