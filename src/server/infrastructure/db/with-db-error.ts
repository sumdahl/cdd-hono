import { logger } from "../logger";
import { AppError, ErrorCode } from "../../core/errors";

export function isDbError(err: unknown): err is { code: string; message: string } {
  return typeof err === "object" && err !== null && "code" in err;
}

export async function withDbError<T>(
  operation: string,
  fn: () => Promise<T>,
  mapError?: (err: { code: string; message: string }) => AppError | null,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logger.error({ err }, `[DB] ${operation} failed`);
    if (mapError && isDbError(err)) {
      const mapped = mapError(err);
      if (mapped) throw mapped;
    }
    throw new AppError(ErrorCode.DB_ERROR, "Database error", 500);
  }
}
