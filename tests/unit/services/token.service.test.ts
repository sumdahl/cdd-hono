import { describe, it, expect, beforeAll } from "bun:test";
import { TockTokenService } from "../../../src/server/infrastructure/services/token.service";
import { AppError } from "../../../src/server/core/errors";

process.env.JWT_ACCESS_SECRET = "test-access-secret-for-unit-tests-only";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-unit-tests-only";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";

const tokenService = new TockTokenService();

describe("TockTokenService", () => {
  it("should generate a valid access token", async () => {
    const token = await tokenService.generateAccessToken({
      userId: "user-123",
      email: "test@example.com",
      roles: ["user"],
    });

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should generate a valid refresh token", async () => {
    const token = await tokenService.generateRefreshToken({
      userId: "user-123",
      email: "test@example.com",
    });

    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("should verify a valid access token and return payload", async () => {
    const token = await tokenService.generateAccessToken({
      userId: "user-123",
      email: "test@example.com",
      roles: ["admin", "user"],
    });

    const payload = await tokenService.verifyAccessToken(token);

    expect(payload.userId).toBe("user-123");
    expect(payload.email).toBe("test@example.com");
    expect(payload.roles).toContain("admin");
    expect(payload.roles).toContain("user");
    expect(payload.jti).toBeTruthy();
  });

  it("should verify a valid refresh token and return userId", async () => {
    const token = await tokenService.generateRefreshToken({
      userId: "user-456",
      email: "another@example.com",
    });

    const result = await tokenService.verifyRefreshToken(token);

    expect(result.userId).toBe("user-456");
  });

  it("should throw INVALID_TOKEN for tampered access token", async () => {
    await expect(
      tokenService.verifyAccessToken("invalid.tampered.token"),
    ).rejects.toThrow(AppError);
  });

  it("should throw INVALID_TOKEN for tampered refresh token", async () => {
    await expect(
      tokenService.verifyRefreshToken("invalid.tampered.token"),
    ).rejects.toThrow(AppError);
  });

  it("should include jti in access token payload", async () => {
    const token = await tokenService.generateAccessToken({
      userId: "user-123",
      email: "test@example.com",
      roles: [],
    });

    const payload = await tokenService.verifyAccessToken(token);
    expect(payload.jti).toBeTruthy();
    expect(payload.jti.length).toBeGreaterThan(0);
  });
});
