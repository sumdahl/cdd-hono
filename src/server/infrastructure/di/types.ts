import { DB } from "../db";
import { PostgresUserRepository } from "../persistence/user.pg.repository";
import { PostgresTokenRepository } from "../persistence/token.pg.repository";
import { PostgresVerificationTokenRepository } from "../persistence/verification-token.pg.repository";
import { ResendEmailService } from "../email/resend.email.service";
import { RegisterUseCase } from "../../core/use-cases/auth/register";
import { LoginUseCase } from "../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../core/use-cases/auth/logout";
import { MeUseCase } from "../../core/use-cases/auth/me";
import { VerifyEmailUseCase } from "../../core/use-cases/auth/verify-email";
import { ResendVerificationUseCase } from "../../core/use-cases/auth/resend-verification";

export interface Cradle {
  // Infrastructure
  db: DB;

  // Repositories
  userRepository: PostgresUserRepository;
  tokenRepository: PostgresTokenRepository;
  verificationTokenRepository: PostgresVerificationTokenRepository;

  // Services
  emailService: ResendEmailService;

  // Auth use-cases
  registerUseCase: RegisterUseCase;
  loginUseCase: LoginUseCase;
  refreshUseCase: RefreshUseCase;
  logoutUseCase: LogoutUseCase;
  meUseCase: MeUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  resendVerificationUseCase: ResendVerificationUseCase;
}
