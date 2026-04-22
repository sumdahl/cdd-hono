import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import { env } from "../../../config/env";
import { AppError, ErrorCode } from "../../../core/errors";

type JwtPayload = {
  sub: string;
  email: string;
};

export const authMiddleware: MiddlewareHandler = createMiddleware(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError(
        "UNAUTHORIZED",
        "Missing or invalid authorization header",
        401,
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      c.set("userId", payload.sub);
      c.set("email", payload.email);
    } catch {
      throw new AppError(
        "UNAUTHORIZED",
        "Invalid or expired access token",
        401,
      );
    }

    await next();
  },
);
