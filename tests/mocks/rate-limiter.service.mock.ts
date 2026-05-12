import { IRateLimiterService } from "../../src/server/core/services/rate-limiter.service";

export class MockRateLimiterService implements IRateLimiterService {
  private allowed = true;

  async isAllowed(): Promise<boolean> {
    return this.allowed;
  }

  async reset(): Promise<void> {}

  setResponse(allowed: boolean) {
    this.allowed = allowed;
  }

  block() {
    this.allowed = false;
  }

  unblock() {
    this.allowed = true;
  }
}
