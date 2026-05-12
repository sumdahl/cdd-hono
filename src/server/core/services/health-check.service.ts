export interface HealthCheckResult {
  status: "ok" | "degraded";
  latencyMs: number;
}

export interface IHealthCheckService {
  check(): Promise<HealthCheckResult>;
}