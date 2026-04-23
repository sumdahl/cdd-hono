export interface IEmailService {
  sendVerificationEmail(to: string, name: string, token: string): Promise<void>;
  sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void>;
}
