import { db } from "../db";
import { sql } from "drizzle-orm";
import { IHealthCheckService, HealthCheckResult } from "../../core/services/health-check.service";

export class DrizzleHealthCheckService implements IHealthCheckService {
  async check(): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
      await db.execute(sql`SELECT 1`);
      return { status: "ok", latencyMs: Date.now() - start };
    } catch {
      return { status: "degraded", latencyMs: Date.now() - start };
    }
  }
}