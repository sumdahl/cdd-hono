import { ITokenService, TokenPayload } from "../../../src/server/core/services/token.service";

export class MockTokenService implements ITokenService {
  private accessTokens: string[] = [];
  private refreshTokens: string[] = [];
  private accessTokenPayloads: { userId: string; email: string; roles: string[] }[] = [];

  async generateAccessToken(user: {
    userId: string;
    email: string;
    roles: string[];
  }): Promise<string> {
    const token = `mock-access-token-${user.userId}-${Date.now()}`;
    this.accessTokens.push(token);
    this.accessTokenPayloads.push({ ...user });
    return token;
  }

  async generateRefreshToken(user: {
    userId: string;
    email: string;
  }): Promise<string> {
    const token = `mock-refresh-token-${user.userId}-${Date.now()}`;
    this.refreshTokens.push(token);
    return token;
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const idx = this.accessTokens.indexOf(token);
    if (idx >= 0) {
      const payload = this.accessTokenPayloads[idx];
      return {
        userId: payload.userId,
        email: payload.email,
        roles: payload.roles,
        jti: "mock-jti",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    if (token.startsWith("mock-access-token-")) {
      return {
        userId: token.split("-")[3],
        email: "test@example.com",
        roles: [],
        jti: "mock-jti",
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
    }
    throw new Error("Invalid token");
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string }> {
    if (token.startsWith("mock-refresh-token-")) {
      return { userId: token.split("-")[3] };
    }
    throw new Error("Invalid token");
  }

  reset() {
    this.accessTokens = [];
    this.refreshTokens = [];
    this.accessTokenPayloads = [];
  }
}
