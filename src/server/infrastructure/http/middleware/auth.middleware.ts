import { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { AppError, ErrorCode } from "../../../core/errors";
import { AppContext } from "../types/context";
import { ISessionVerifier } from "../../../core/services/session-verifier.service";

export type AuthMiddlewareDeps = {
  sessionVerifier: ISessionVerifier;
};

export function createAuthMiddleware({
  sessionVerifier,
}: AuthMiddlewareDeps): MiddlewareHandler<AppContext> {
  return createMiddleware(async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Missing or invalid authorization header",
        401,
      );
    }

    const token = authHeader.split(" ")[1];
    const session = await sessionVerifier.verify(token);

    c.set("userId", session.userId);
    c.set("email", session.email);
    c.set("roles", session.roles);
    c.set("jti", session.jti);
    c.set("exp", session.exp);

    await next();
  });
}

export const requireRole = (
  ...requiredRoles: string[]
): MiddlewareHandler<AppContext> =>
  createMiddleware(async (c, next) => {
    const userRoles = c.get("roles") ?? [];
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      throw new AppError(ErrorCode.FORBIDDEN, "Insufficient role", 403);
    }
    await next();
  });

export const requirePermission = (
  ...requiredPermissions: string[]
): MiddlewareHandler<AppContext> =>
  createMiddleware(async (c, next) => {
    const userPermissions = c.get("permissions") ?? [];
    const hasPermission = requiredPermissions.every((p) =>
      userPermissions.includes(p),
    );
    if (!hasPermission) {
      throw new AppError(
        ErrorCode.FORBIDDEN,
        "Insufficient permissions",
        403,
      );
    }
    await next();
  });

export const requireOwnership = (
  getResourceUserId: (c: Context<AppContext>) => string,
): MiddlewareHandler<AppContext> =>
  createMiddleware(async (c, next) => {
    const userId = c.get("userId");
    const resourceUserId = getResourceUserId(c);
    const userRoles = c.get("roles") ?? [];
    if (userId !== resourceUserId && !userRoles.includes("admin")) {
      throw new AppError(ErrorCode.FORBIDDEN, "Access denied", 403);
    }
    await next();
  });
