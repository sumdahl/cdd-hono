import { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { formatSuccess } from "./response.formatter";

export const successHandler = <T, S extends ContentfulStatusCode = 200>(
  c: Context,
  data: T,
  message?: string,
  statusCode?: S,
) => {
  const status = (statusCode ?? 200) as ContentfulStatusCode;
  return c.json(formatSuccess(data, message), status);
};
