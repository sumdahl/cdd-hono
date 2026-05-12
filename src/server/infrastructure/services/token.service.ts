import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import {
  ITokenService,
  TokenPayload,
} from "../../core/services/token.service";
import { AppError, ErrorCode } from "../../core/errors";

export class TockTokenService implements ITokenService {
  async generateAccessToken(user: {
    userId: string;
    email: string;
    roles: string[];
  }): Promise<string> {
    const jti = crypto.randomUUID();
    return jwt.sign(
      { email: user.email, roles: user.roles, jti },
      env.JWT_ACCESS_SECRET,
      {
        subject: user.userId,
        expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
      },
    );
  }

  async generateRefreshToken(user: {
    userId: string;
    email: string;
  }): Promise<string> {
    return jwt.sign({}, env.JWT_REFRESH_SECRET, {
      subject: user.userId,
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET,
      ) as jwt.JwtPayload;
      return {
        userId: payload.sub as string,
        email: payload["email"] as string,
        roles: (payload["roles"] as string[]) ?? [],
        jti: payload["jti"] as string,
        exp: payload.exp as number,
        iat: payload.iat as number,
      };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(ErrorCode.TOKEN_EXPIRED, "Access token expired", 401);
      }
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        "Invalid access token",
        401,
      );
    }
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    try {
      const payload = jwt.verify(
        token,
        env.JWT_REFRESH_SECRET,
      ) as jwt.JwtPayload;
      return { userId: payload.sub as string };
    } catch {
      throw new AppError(
        ErrorCode.INVALID_TOKEN,
        "Invalid refresh token",
        401,
      );
    }
  }
}
