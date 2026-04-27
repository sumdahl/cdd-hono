import { createContainer, asClass, asValue, InjectionMode } from "awilix";
import { db } from "../db";
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
import { Cradle } from "./types";

export const container = createContainer<Cradle>({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Infrastructure
  db: asValue(db),

  // Repositories
  userRepository: asClass(PostgresUserRepository).singleton(),
  tokenRepository: asClass(PostgresTokenRepository).singleton(),
  verificationTokenRepository: asClass(
    PostgresVerificationTokenRepository,
  ).singleton(),
  passwordResetTokenRepository: asClass(
    PostgresPasswordResetTokenRepository,
  ).singleton(),
  roleRepository: asClass(PostgresRoleRepository).singleton(),

  // Services
  emailService: asClass(ResendEmailService).singleton(),

  // Auth use-cases
  registerUseCase: asClass(RegisterUseCase).singleton(),
  loginUseCase: asClass(LoginUseCase).singleton(),
  refreshUseCase: asClass(RefreshUseCase).singleton(),
  logoutUseCase: asClass(LogoutUseCase).singleton(),
  meUseCase: asClass(MeUseCase).singleton(),
  verifyEmailUseCase: asClass(VerifyEmailUseCase).singleton(),
  resendVerificationUseCase: asClass(ResendVerificationUseCase).singleton(),
  forgotPasswordUseCase: asClass(ForgotPasswordUseCase).singleton(),
  resetPasswordUseCase: asClass(ResetPasswordUseCase).singleton(),

  // Admin use-cases
  getAllUsersUseCase: asClass(GetAllUsersUseCase).singleton(),
  getUserByIdUseCase: asClass(GetUserByIdUseCase).singleton(),
  deleteUserUseCase: asClass(DeleteUserUseCase).singleton(),
  getAllRolesUseCase: asClass(GetAllRolesUseCase).singleton(),
  assignRoleUseCase: asClass(AssignRoleUseCase).singleton(),
  removeRoleUseCase: asClass(RemoveRoleUseCase).singleton(),
});
