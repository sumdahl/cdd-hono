import { createRoute, z } from "@hono/zod-openapi";
import { RegisterUseCase } from "../../../core/use-cases/auth/register";
import { LoginUseCase } from "../../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../../core/use-cases/auth/logout";
import { MeUseCase } from "../../../core/use-cases/auth/me";
import { VerifyEmailUseCase } from "../../../core/use-cases/auth/verify-email";
import { ResendVerificationUseCase } from "../../../core/use-cases/auth/resend-verification";
import { ForgotPasswordUseCase } from "../../../core/use-cases/auth/forgot-password";
import { ResetPasswordUseCase } from "../../../core/use-cases/auth/reset-password";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  authResponseSchema,
  accessTokenResponseSchema,
  userResponseSchema,
} from "./auth.schemas";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  successResponseSchema,
  errorResponseSchema,
} from "../response/response.schemas";
import { successHandler } from "../response/response.handler";
import { createAppRouter } from "../shared/create-router";

export function createAuthRouter(
  register: RegisterUseCase,
  login: LoginUseCase,
  refresh: RefreshUseCase,
  logout: LogoutUseCase,
  me: MeUseCase,
  verifyEmail: VerifyEmailUseCase,
  resendVerification: ResendVerificationUseCase,
  forgotPassword: ForgotPasswordUseCase,
  resetPassword: ResetPasswordUseCase,
) {
  const router = createAppRouter();

  const registerRoute = createRoute({
    method: "post",
    path: "/register",
    tags: ["Auth"],
    description: "Register a new user — sends a verification email",
    request: {
      body: { content: { "application/json": { schema: registerSchema } } },
    },
    responses: {
      201: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              z.object({ user: userResponseSchema }),
            ),
          },
        },
        description: "User registered successfully",
      },
      409: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Email already in use",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  const loginRoute = createRoute({
    method: "post",
    path: "/login",
    tags: ["Auth"],
    description: "Login with email and password",
    request: {
      body: { content: { "application/json": { schema: loginSchema } } },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(authResponseSchema),
          },
        },
        description: "Login successful",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Invalid credentials",
      },
      403: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Email not verified",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  const refreshRoute = createRoute({
    method: "post",
    path: "/refresh",
    tags: ["Auth"],
    description: "Refresh access token",
    request: {
      body: { content: { "application/json": { schema: refreshSchema } } },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(accessTokenResponseSchema),
          },
        },
        description: "Token refreshed successfully",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Invalid or expired refresh token",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  const logoutRoute = createRoute({
    method: "post",
    path: "/logout",
    tags: ["Auth"],
    description: "Logout and invalidate refresh token",
    request: {
      body: { content: { "application/json": { schema: logoutSchema } } },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Logged out successfully",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Invalid or already-used refresh token",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  const meRoute = createRoute({
    method: "get",
    path: "/me",
    tags: ["Auth"],
    description: "Get current authenticated user",
    middleware: [authMiddleware],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(
              z.object({ user: userResponseSchema }),
            ),
          },
        },
        description: "Current user",
      },
      401: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Missing or invalid access token",
      },
    },
  });

  const verifyEmailRoute = createRoute({
    method: "get",
    path: "/verify-email",
    tags: ["Auth"],
    description: "Verify email address using token from email link",
    request: {
      query: verifyEmailSchema,
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Email verified successfully",
      },
      400: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Invalid or expired verification token",
      },
      409: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Email already verified",
      },
    },
  });

  const resendVerificationRoute = createRoute({
    method: "post",
    path: "/resend-verification",
    tags: ["Auth"],
    description: "Resend verification email",
    request: {
      body: {
        content: { "application/json": { schema: resendVerificationSchema } },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Verification email resent",
      },
      404: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "User not found",
      },
      409: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Email already verified",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  const forgotPasswordRoute = createRoute({
    method: "post",
    path: "/forgot-password",
    tags: ["Auth"],
    description:
      "Request a password reset email — always returns 200 to avoid leaking user existence",
    request: {
      body: {
        content: { "application/json": { schema: forgotPasswordSchema } },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Password reset email sent if account exists",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  const resetPasswordRoute = createRoute({
    method: "post",
    path: "/reset-password",
    tags: ["Auth"],
    description: "Reset password using token from email",
    request: {
      body: {
        content: { "application/json": { schema: resetPasswordSchema } },
      },
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: successResponseSchema(z.object({})),
          },
        },
        description: "Password reset successfully",
      },
      400: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Invalid or expired reset token",
      },
      422: {
        content: { "application/json": { schema: errorResponseSchema } },
        description: "Validation error",
      },
    },
  });

  router.openapi(registerRoute, async (c) => {
    const input = c.req.valid("json");
    const user = await register.execute(input);
    return successHandler(
      c,
      { user },
      "Registration successful. Please check your email to verify your account.",
      201,
    );
  });

  router.openapi(loginRoute, async (c) => {
    const input = c.req.valid("json");
    const result = await login.execute(input);
    return successHandler(c, result, "Login successful");
  });

  router.openapi(refreshRoute, async (c) => {
    const { refreshToken } = c.req.valid("json");
    const result = await refresh.execute(refreshToken);
    return successHandler(c, result, "Token refreshed");
  });

  router.openapi(logoutRoute, async (c) => {
    const { refreshToken } = c.req.valid("json");
    await logout.execute(refreshToken);
    return successHandler(c, {}, "Logged out successfully");
  });

  router.openapi(meRoute, async (c) => {
    const userId = c.get("userId");
    const user = await me.execute(userId);
    return successHandler(c, { user });
  });

  router.openapi(verifyEmailRoute, async (c) => {
    const { token } = c.req.valid("query");
    await verifyEmail.execute(token);
    return successHandler(c, {}, "Email verified successfully");
  });

  router.openapi(resendVerificationRoute, async (c) => {
    const { email } = c.req.valid("json");
    await resendVerification.execute(email);
    return successHandler(c, {}, "Verification email sent");
  });

  router.openapi(forgotPasswordRoute, async (c) => {
    const { email } = c.req.valid("json");
    await forgotPassword.execute(email);
    return successHandler(
      c,
      {},
      "If that email is registered, a reset link has been sent",
    );
  });

  router.openapi(resetPasswordRoute, async (c) => {
    const input = c.req.valid("json");
    await resetPassword.execute(input);
    return successHandler(c, {}, "Password reset successfully");
  });

  return router;
}
