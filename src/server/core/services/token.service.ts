export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  jti: string;
  exp: number;
  iat?: number;
}

export interface ITokenService {
  generateAccessToken(user: {
    userId: string;
    email: string;
    roles: string[];
  }): Promise<string>;
  generateRefreshToken(user: { userId: string; email: string }): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<{ userId: string }>;
}
