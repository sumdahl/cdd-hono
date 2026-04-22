export interface ITokenRepository {
  save(userId: string, token: string, expiresAt: Date): Promise<void>;
  find(token: string): Promise<{ userId: string; expiresAt: Date } | null>;
  delete(token: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
