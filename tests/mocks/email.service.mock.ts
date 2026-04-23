import { IEmailService } from "../../src/server/core/services/email.service";

export class MockEmailService implements IEmailService {
  public sentEmails: {
    type: "verification" | "passwordReset";
    to: string;
    name: string;
    token: string;
  }[] = [];

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    this.sentEmails.push({ type: "verification", to, name, token });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    this.sentEmails.push({ type: "passwordReset", to, name, token });
  }

  getLastVerificationEmail() {
    return (
      this.sentEmails.filter((e) => e.type === "verification").at(-1) ?? null
    );
  }

  getLastPasswordResetEmail() {
    return (
      this.sentEmails.filter((e) => e.type === "passwordReset").at(-1) ?? null
    );
  }

  reset() {
    this.sentEmails = [];
  }
}
