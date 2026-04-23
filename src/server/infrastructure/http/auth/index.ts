import { container } from "../../di/container";
import { createAuthRouter } from "./auth.routes";

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
} = container.cradle;

export const authRouter = createAuthRouter(
  registerUseCase,
  loginUseCase,
  refreshUseCase,
  logoutUseCase,
  meUseCase,
  verifyEmailUseCase,
  resendVerificationUseCase,
  forgotPasswordUseCase,
  resetPasswordUseCase,
);
