import { createContainer, asClass, asValue, InjectionMode } from "awilix";
import { db } from "../db";
import { PostgresUserRepository } from "../persistence/user.pg.repository";
import { PostgresTokenRepository } from "../persistence/token.pg.repository";
import { RegisterUseCase } from "../../core/use-cases/auth/register";
import { LoginUseCase } from "../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../core/use-cases/auth/logout";
import { MeUseCase } from "../../core/use-cases/auth/me";
import { Cradle } from "./types";

export const container = createContainer<Cradle>({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Infrastructure
  db: asValue(db),

  // Repositories
  userRepository: asClass(PostgresUserRepository).singleton(),
  tokenRepository: asClass(PostgresTokenRepository).singleton(),

  // Auth use-cases
  registerUseCase: asClass(RegisterUseCase).singleton(),
  loginUseCase: asClass(LoginUseCase).singleton(),
  refreshUseCase: asClass(RefreshUseCase).singleton(),
  logoutUseCase: asClass(LogoutUseCase).singleton(),
  meUseCase: asClass(MeUseCase).singleton(),
});
