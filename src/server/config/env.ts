import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  RESEND_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("noreply@sumirandahal.com.np"),
  APP_URL: z.string().default("http://localhost:8000"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(" Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
