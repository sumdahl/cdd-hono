import { sql } from "drizzle-orm";

export const countAll = sql<number>`count(*)::int`;
