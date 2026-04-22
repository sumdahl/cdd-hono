import { IUserRepository } from "../../repositories/user.repository";
import { AppError, ErrorCode } from "../../errors";
import { env } from "../../../config/env";
import jwt from "jsonwebtoken";

export class RefreshUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(token: string) {
    const stored = await this.userRepository.findRefreshToken(token);
    if (!stored) {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        "Refresh token not found",
        401,
      );
    }

    if (stored.expiresAt < new Date()) {
      await this.userRepository.deleteRefreshToken(token);
      throw new AppError(ErrorCode.TOKEN_EXPIRED, "Refresh token expired", 401);
    }

    try {
      jwt.verify(token, env.JWT_REFRESH_SECRET);
    } catch {
      await this.userRepository.deleteRefreshToken(token);
      throw new AppError(ErrorCode.INVALID_TOKEN, "Invalid refresh token", 401);
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      await this.userRepository.deleteRefreshToken(token);
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", 404);
    }

    // rotation — delete old token, issue new one
    await this.userRepository.deleteRefreshToken(token);

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );

    const newRefreshToken = jwt.sign({ sub: user.id }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.userRepository.saveRefreshToken(
      user.id,
      newRefreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken: newRefreshToken };
  }
}
