// @.rules
import { Redis } from "ioredis";
import { IPasswordResetTokenRepository } from "../../core/repositories/password-reset-token.repository";
import { IRoleRepository } from "../../core/repositories/role.repository";
import { ITokenRepository } from "../../core/repositories/token.repository";
import { IUserRepository } from "../../core/repositories/user.repository";
import { IVerificationTokenRepository } from "../../core/repositories/verification-token.repository";
import { IEmailService } from "../../core/services/email.service";
import { IRateLimiterService } from "../../core/services/rate-limiter.service";
import { ITokenBlacklistService } from "../../core/services/token-blacklist.service";
import { ITokenService } from "../../core/services/token.service";
import { IHealthCheckService } from "../../core/services/health-check.service";
import { ISessionVerifier } from "../../core/services/session-verifier.service";
import { AssignRoleUseCase } from "../../core/use-cases/admin/assign-role";
import { DeleteUserUseCase } from "../../core/use-cases/admin/delete-user";
import { GetAllRolesUseCase } from "../../core/use-cases/admin/get-all-roles";
import { GetAllUsersUseCase } from "../../core/use-cases/admin/get-all-users";
import { GetUserByIdUseCase } from "../../core/use-cases/admin/get-user-by-id";
import { RemoveRoleUseCase } from "../../core/use-cases/admin/remove-role";
import { ForgotPasswordUseCase } from "../../core/use-cases/auth/forgot-password";
import { LoginUseCase } from "../../core/use-cases/auth/login";
import { LogoutUseCase } from "../../core/use-cases/auth/logout";
import { MeUseCase } from "../../core/use-cases/auth/me";
import { RefreshUseCase } from "../../core/use-cases/auth/refresh";
import { RegisterUseCase } from "../../core/use-cases/auth/register";
import { ResendVerificationUseCase } from "../../core/use-cases/auth/resend-verification";
import { ResetPasswordUseCase } from "../../core/use-cases/auth/reset-password";
import { VerifyEmailUseCase } from "../../core/use-cases/auth/verify-email";
import { DB } from "../db";

export interface Cradle {
  // Infrastructure
  db: DB;

  // Redis
  redis: Redis;
  tokenBlacklistService: ITokenBlacklistService;

  // Repositories
  userRepository: IUserRepository;
  tokenRepository: ITokenRepository;
  verificationTokenRepository: IVerificationTokenRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  roleRepository: IRoleRepository;

  // Services
  emailService: IEmailService;
  rateLimiterService: IRateLimiterService;
  tokenService: ITokenService;
  healthCheckService: IHealthCheckService;
  sessionVerifier: ISessionVerifier;

  // Auth use-cases
  registerUseCase: RegisterUseCase;
  loginUseCase: LoginUseCase;
  refreshUseCase: RefreshUseCase;
  logoutUseCase: LogoutUseCase;
  meUseCase: MeUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  resendVerificationUseCase: ResendVerificationUseCase;
  forgotPasswordUseCase: ForgotPasswordUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;

  // Admin use-cases
  getAllUsersUseCase: GetAllUsersUseCase;
  getUserByIdUseCase: GetUserByIdUseCase;
  deleteUserUseCase: DeleteUserUseCase;
  getAllRolesUseCase: GetAllRolesUseCase;
  assignRoleUseCase: AssignRoleUseCase;
  removeRoleUseCase: RemoveRoleUseCase;
}
