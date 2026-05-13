// @.rules
import { z } from "@hono/zod-openapi";

export const registerSchema = z
  .object({
    email: z.email("Invalid email"),
    name: z.string().min(1, "Name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .openapi("RegisterRequest");

export const loginSchema = z
  .object({
    email: z.email("Invalid email"),
    password: z.string().min(1, "Password is required"),
  })
  .openapi("LoginRequest");

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  })
  .openapi("RefreshRequest");

export const logoutSchema = z
  .object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  })
  .openapi("LogoutRequest");

export const verifyEmailSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
  })
  .openapi("VerifyEmailRequest");

export const resendVerificationSchema = z
  .object({
    email: z.email("Invalid email"),
  })
  .openapi("ResendVerificationRequest");

export const forgotPasswordSchema = z
  .object({
    email: z.email("Invalid email"),
  })
  .openapi("ForgotPasswordRequest");

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .openapi("ResetPasswordRequest");

export const userResponseSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    roles: z.array(z.string()),
  })
  .openapi("UserResponse");

export const registerResponseSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    verificationEmailSent: z.boolean(),
  })
  .openapi("RegisterResponse");

export const authResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: userResponseSchema,
  })
  .openapi("AuthResponse");

export const accessTokenResponseSchema = z
  .object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
  .openapi("AccessTokenResponse");
