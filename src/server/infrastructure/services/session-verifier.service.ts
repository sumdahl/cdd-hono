import { ITokenService } from "../../core/services/token.service";
import { ITokenBlacklistService } from "../../core/services/token-blacklist.service";
import { IUserRepository } from "../../core/repositories/user.repository";
import { ISessionVerifier, Session } from "../../core/services/session-verifier.service";
import { AppError, ErrorCode } from "../../core/errors";

export class SessionVerifier implements ISessionVerifier {
  constructor(
    private readonly tokenService: ITokenService,
    private readonly userRepository: IUserRepository,
    private readonly tokenBlacklistService: ITokenBlacklistService,
  ) {}

  async verify(accessToken: string): Promise<Session> {
    let payload: { userId: string; email: string; roles: string[]; jti: string; exp: number };

    try {
      payload = await this.tokenService.verifyAccessToken(accessToken);
    } catch {
      throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired access token", 401);
    }

    if (payload.jti) {
      const blacklisted = await this.tokenBlacklistService.isBlacklisted(payload.jti);
      if (blacklisted) {
        throw new AppError(ErrorCode.UNAUTHORIZED, "Token has been revoked", 401);
      }
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "User no longer exists", 401);
    }

    return {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles ?? [],
      jti: payload.jti,
      exp: payload.exp,
    };
  }
}
