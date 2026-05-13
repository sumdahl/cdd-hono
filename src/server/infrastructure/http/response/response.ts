import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "@hono/zod-openapi";
import { ErrorCode } from "../../../core/errors";

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: unknown;
  };
};

export const formatSuccess = <T>(
  data: T,
  message?: string,
): ApiSuccessResponse<T> => ({
  success: true,
  data,
  message,
});

export const formatError = (
  code: ErrorCode | string,
  message: string,
  details?: unknown,
): ApiErrorResponse => ({
  success: false,
  error: { code, message, details },
});

export const successHandler = <T, S extends ContentfulStatusCode = 200>(
  c: Context,
  data: T,
  message?: string,
  statusCode?: S,
) => {
  const status = (statusCode ?? 200) as ContentfulStatusCode;
  return c.json(formatSuccess(data, message), status);
};

export const successResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    success: z.literal(true),
    data: schema,
    message: z.string().optional(),
  });

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.unknown().optional(),
    }),
  })
  .openapi("ErrorResponse");
