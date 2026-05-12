import { container } from "../../di/container";
import { createAuthRouter } from "./auth.routes";
import { createAuthMiddleware } from "../middleware/auth.middleware";

const {
  registerUseCase,
  loginUseCase,
  refreshUseCase,
  logoutUseCase,
  meUseCase,
  verifyEmailUseCase,
  resendVerificationUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
  tokenService,
  userRepository,
  tokenBlacklistService,
} = container.cradle;

export const authRouter = createAuthRouter(
  {
    register: registerUseCase,
    login: loginUseCase,
    refresh: refreshUseCase,
    logout: logoutUseCase,
    me: meUseCase,
    verifyEmail: verifyEmailUseCase,
    resendVerification: resendVerificationUseCase,
    forgotPassword: forgotPasswordUseCase,
    resetPassword: resetPasswordUseCase,
  },
  {
    authMiddleware: createAuthMiddleware({
      tokenService,
      userRepository,
      tokenBlacklistService,
    }),
  },
);
