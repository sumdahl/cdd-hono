import { VerificationTokenEntity } from "../entities/verification-token.entity";

export interface IVerificationTokenRepository {
  save(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<VerificationTokenEntity>;
  find(token: string): Promise<VerificationTokenEntity | null>;
  delete(token: string): Promise<void>;
  deleteAllForUser(userId: string): Promise<void>;
}
