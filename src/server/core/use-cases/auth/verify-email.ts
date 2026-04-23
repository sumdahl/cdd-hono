import { IUserRepository } from "../../repositories/user.repository";
import { IVerificationTokenRepository } from "../../repositories/verification-token.respository";
import { AppError, ErrorCode } from "../../errors";

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationTokenRepository: IVerificationTokenRepository,
  ) {}

  async execute(token: string) {
    const stored = await this.verificationTokenRepository.find(token);
    if (!stored) {
      throw new AppError(
        ErrorCode.VERIFICATION_TOKEN_INVALID,
        "Invalid verification token",
        400,
      );
    }

    if (stored.expiresAt < new Date()) {
      await this.verificationTokenRepository.delete(token);
      throw new AppError(
        ErrorCode.VERIFICATION_TOKEN_EXPIRED,
        "Verification token expired",
        400,
      );
    }

    const user = await this.userRepository.findById(stored.userId);
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

    await this.userRepository.markAsVerified(user.id);
    await this.verificationTokenRepository.delete(token);

    return { message: "Email verified successfully" };
  }
}
