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
