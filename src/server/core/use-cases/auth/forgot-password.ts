import { IUserRepository } from "../../repositories/user.repository";
import { ITokenRepository } from "../../repositories/token.repository";
import { IEmailService } from "../../services/email.service";
import crypto from "crypto";

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: ITokenRepository,
    private readonly emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.isVerified) return;

    await this.passwordResetTokenRepository.deleteAllForUser(user.id);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await this.passwordResetTokenRepository.save(user.id, token, expiresAt);

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      token,
    );
  }
}
