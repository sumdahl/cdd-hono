import { IUserRepository } from "../../repositories/user.repository";
import { ITokenRepository } from "../../repositories/token.repository";
import { AppError, ErrorCode } from "../../errors";
import bcryptjs from "bcryptjs";

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: ITokenRepository,
  ) {}

  async execute(data: { token: string; password: string }): Promise<void> {
    const record = await this.passwordResetTokenRepository.find(data.token);
    if (!record) {
      throw new AppError(
        ErrorCode.PASSWORD_RESET_TOKEN_INVALID,
        "Invalid password reset token",
        400,
      );
    }

    if (record.expiresAt < new Date()) {
      await this.passwordResetTokenRepository.delete(data.token);
      throw new AppError(
        ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED,
        "Password reset token has expired",
        400,
      );
    }

    const passwordHash = bcryptjs.hashSync(data.password, 12);
    await this.userRepository.updatePassword(record.userId, passwordHash);
    await this.passwordResetTokenRepository.delete(data.token);
  }
}
