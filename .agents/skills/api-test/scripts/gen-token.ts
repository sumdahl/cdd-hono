import "../../../../src/server/config/env";
import { TockTokenService } from "../../../../src/server/infrastructure/services/token.service";

const tokenService = new TockTokenService();

async function main() {
  const cmd = process.argv[2];
  const userId = process.argv[3];
  const email = process.argv[4] ?? "test@test.com";
  const roles = (process.argv[5] ?? "user").split(",");

  if (cmd === "access") {
    const token = await tokenService.generateAccessToken({ userId, email, roles });
    console.log(token);
  } else if (cmd === "refresh") {
    const token = await tokenService.generateRefreshToken({ userId, email });
    console.log(token);
  } else {
    console.error("Usage: bun gen-token.ts access <userId> [email] [roles]");
    process.exit(1);
  }
}

main();
