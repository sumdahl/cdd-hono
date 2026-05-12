import { IHealthCheckService, HealthCheckResult } from "../../../src/server/core/services/health-check.service";

export class MockHealthCheckService implements IHealthCheckService {
  private response: HealthCheckResult = { status: "ok", latencyMs: 1 };

  setResponse(response: HealthCheckResult) {
    this.response = response;
  }

  async check(): Promise<HealthCheckResult> {
    return this.response;
  }
}