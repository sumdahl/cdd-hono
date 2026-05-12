import { IUserRepository } from "../../repositories/user.repository";
import { ITokenRepository } from "../../repositories/token.repository";
import { AppError, ErrorCode } from "../../errors";
import { ITokenService } from "../../services/token.service";

export class RefreshUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(token: string) {
    const stored = await this.tokenRepository.find(token);
    if (!stored) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        "Refresh token not found",
        401,
      );
    }

    if (stored.expiresAt < new Date()) {
      await this.tokenRepository.delete(token);
      throw new AppError(ErrorCode.TOKEN_EXPIRED, "Refresh token expired", 401);
    }

    await this.tokenService.verifyRefreshToken(token);

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      await this.tokenRepository.delete(token);
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    await this.tokenRepository.delete(token);

    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      roles: [],
    });

    const newRefreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.tokenRepository.save(user.id, newRefreshToken, expiresAt);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
