import { Context, MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { AppError, ErrorCode } from "../../../core/errors";
import { AppContext } from "../types/context";
import { ITokenService } from "../../../core/services/token.service";
import { ITokenBlacklistService } from "../../../core/services/token-blacklist.service";
import { IUserRepository } from "../../../core/repositories/user.repository";

export type AuthMiddlewareDeps = {
  tokenService: ITokenService;
  userRepository: IUserRepository;
  tokenBlacklistService: ITokenBlacklistService;
};

export function createAuthMiddleware({
  tokenService,
  userRepository,
  tokenBlacklistService,
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
    let payload;

    try {
      payload = await tokenService.verifyAccessToken(token);
    } catch (err) {
      if (err instanceof AppError) {
        throw new AppError(ErrorCode.UNAUTHORIZED, err.message, 401);
      }
      throw new AppError(
        ErrorCode.UNAUTHORIZED,
        "Invalid or expired access token",
        401,
      );
    }

    if (payload.jti) {
      const blacklisted = await tokenBlacklistService.isBlacklisted(
        payload.jti,
      );
      if (blacklisted) {
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          "Token has been revoked",
          401,
        );
      }
    }

    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "User no longer exists", 401);
    }

    c.set("userId", payload.userId);
    c.set("email", payload.email);
    c.set("roles", payload.roles ?? []);
    c.set("jti", payload.jti);
    c.set("exp", payload.exp);

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
