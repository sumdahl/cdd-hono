import { z } from "@hono/zod-openapi";

export const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  isVerified: z.boolean(),
  roles: z.array(z.string()),
  createdAt: z.string(),
});

export const assignRoleSchema = z.object({
  role: z.string().min(1, "Role is required"),
});

export const roleResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
});
