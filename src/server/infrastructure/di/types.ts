import { DB } from "../db";
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

export interface Cradle {
  // Infrastructure
  db: DB;

  // Repositories
  userRepository: PostgresUserRepository;
  tokenRepository: PostgresTokenRepository;
  verificationTokenRepository: PostgresVerificationTokenRepository;
  passwordResetTokenRepository: PostgresPasswordResetTokenRepository;
  roleRepository: PostgresRoleRepository;

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
