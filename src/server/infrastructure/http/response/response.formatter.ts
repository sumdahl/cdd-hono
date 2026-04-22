import { ApiSuccessResponse, ApiErrorResponse } from "./response.types";
import { ErrorCode } from "../../../core/errors";

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
