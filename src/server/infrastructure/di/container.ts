// @.rules
import { createContainer, asClass, asValue, InjectionMode } from "awilix";
import { Redis } from "ioredis";
import { db, DB } from "../db";
import { PostgresUserRepository } from "../persistence/user.pg.repository";
import { PostgresTokenRepository } from "../persistence/token.pg.repository";
import { PostgresVerificationTokenRepository } from "../persistence/verification-token.pg.repository";
import { PostgresPasswordResetTokenRepository } from "../persistence/password-reset-token.pg.repository";
import { PostgresRoleRepository } from "../persistence/role.pg.repository";
import { ResendEmailService } from "../email/resend.email.service";
import { RegisterUseCase } from "../../core/use-cases/auth/register";
import { LoginUseCase } from "../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../core/use-cases/auth/logout";
import { MeUseCase } from "../../core/use-cases/auth/me";
import { VerifyEmailUseCase } from "../../core/use-cases/auth/verify-email";
import { ResendVerificationUseCase } from "../../core/use-cases/auth/resend-verification";
import { ForgotPasswordUseCase } from "../../core/use-cases/auth/forgot-password";
import { ResetPasswordUseCase } from "../../core/use-cases/auth/reset-password";
import { GetAllUsersUseCase } from "../../core/use-cases/admin/get-all-users";
import { GetUserByIdUseCase } from "../../core/use-cases/admin/get-user-by-id";
import { DeleteUserUseCase } from "../../core/use-cases/admin/delete-user";
import { GetAllRolesUseCase } from "../../core/use-cases/admin/get-all-roles";
import { AssignRoleUseCase } from "../../core/use-cases/admin/assign-role";
import { RemoveRoleUseCase } from "../../core/use-cases/admin/remove-role";
import { InMemoryRateLimiterService } from "../services/in-memory-rate-limiter.service";
import { redis } from "../redis";
import { RedisTokenBlacklistService } from "../services/redis-token-blacklist.service";
import { TockTokenService } from "../services/token.service";
import { DrizzleHealthCheckService } from "../services/drizzle-health-check.service";
import { IUserRepository } from "../../core/repositories/user.repository";
import { ITokenRepository } from "../../core/repositories/token.repository";
import { IVerificationTokenRepository } from "../../core/repositories/verification-token.repository";
import { IPasswordResetTokenRepository } from "../../core/repositories/password-reset-token.repository";
import { IRoleRepository } from "../../core/repositories/role.repository";
import { IEmailService } from "../../core/services/email.service";
import { IRateLimiterService } from "../../core/services/rate-limiter.service";
import { ITokenService } from "../../core/services/token.service";
import { ITokenBlacklistService } from "../../core/services/token-blacklist.service";
import { IHealthCheckService } from "../../core/services/health-check.service";

export interface Cradle {
  db: DB;
  redis: Redis;
  tokenBlacklistService: ITokenBlacklistService;

  userRepository: IUserRepository;
  tokenRepository: ITokenRepository;
  verificationTokenRepository: IVerificationTokenRepository;
  passwordResetTokenRepository: IPasswordResetTokenRepository;
  roleRepository: IRoleRepository;

  emailService: IEmailService;
  rateLimiterService: IRateLimiterService;
  tokenService: ITokenService;
  healthCheckService: IHealthCheckService;

  registerUseCase: RegisterUseCase;
  loginUseCase: LoginUseCase;
  refreshUseCase: RefreshUseCase;
  logoutUseCase: LogoutUseCase;
  meUseCase: MeUseCase;
  verifyEmailUseCase: VerifyEmailUseCase;
  resendVerificationUseCase: ResendVerificationUseCase;
  forgotPasswordUseCase: ForgotPasswordUseCase;
  resetPasswordUseCase: ResetPasswordUseCase;

  getAllUsersUseCase: GetAllUsersUseCase;
  getUserByIdUseCase: GetUserByIdUseCase;
  deleteUserUseCase: DeleteUserUseCase;
  getAllRolesUseCase: GetAllRolesUseCase;
  assignRoleUseCase: AssignRoleUseCase;
  removeRoleUseCase: RemoveRoleUseCase;
}

export const container = createContainer<Cradle>({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  db: asValue(db),

  redis: asValue(redis),
  tokenBlacklistService: asClass(RedisTokenBlacklistService).singleton(),

  userRepository: asClass(PostgresUserRepository).singleton(),
  tokenRepository: asClass(PostgresTokenRepository).singleton(),
  verificationTokenRepository: asClass(PostgresVerificationTokenRepository).singleton(),
  passwordResetTokenRepository: asClass(PostgresPasswordResetTokenRepository).singleton(),
  roleRepository: asClass(PostgresRoleRepository).singleton(),

  emailService: asClass(ResendEmailService).singleton(),

  registerUseCase: asClass(RegisterUseCase).singleton(),
  loginUseCase: asClass(LoginUseCase).singleton(),
  refreshUseCase: asClass(RefreshUseCase).singleton(),
  logoutUseCase: asClass(LogoutUseCase).singleton(),
  meUseCase: asClass(MeUseCase).singleton(),
  verifyEmailUseCase: asClass(VerifyEmailUseCase).singleton(),
  resendVerificationUseCase: asClass(ResendVerificationUseCase).singleton(),
  forgotPasswordUseCase: asClass(ForgotPasswordUseCase).singleton(),
  resetPasswordUseCase: asClass(ResetPasswordUseCase).singleton(),

  getAllUsersUseCase: asClass(GetAllUsersUseCase).singleton(),
  getUserByIdUseCase: asClass(GetUserByIdUseCase).singleton(),
  deleteUserUseCase: asClass(DeleteUserUseCase).singleton(),
  getAllRolesUseCase: asClass(GetAllRolesUseCase).singleton(),
  assignRoleUseCase: asClass(AssignRoleUseCase).singleton(),
  removeRoleUseCase: asClass(RemoveRoleUseCase).singleton(),

  rateLimiterService: asClass(InMemoryRateLimiterService).singleton(),
  tokenService: asClass(TockTokenService).singleton(),
  healthCheckService: asClass(DrizzleHealthCheckService).singleton(),
});
