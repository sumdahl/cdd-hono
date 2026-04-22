import { createContainer, asClass, asValue, InjectionMode } from "awilix";
import { db } from "../db";
import { PostgresUserRepository } from "../persistence/user.pg.repository";
import { PostgresTodoRepository } from "../persistence/todo.pg.repository";
import { RegisterUseCase } from "../../core/use-cases/auth/register";
import { LoginUseCase } from "../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../core/use-cases/auth/logout";
import { MeUseCase } from "../../core/use-cases/auth/me";
import { GetAllTodosUseCase } from "../../core/use-cases/todos/get-all-todos";
import { CreateTodoUseCase } from "../../core/use-cases/todos/create-todo";
import { Cradle } from "./types";

export const container = createContainer<Cradle>({
  injectionMode: InjectionMode.CLASSIC,
});

container.register({
  // Infrastructure
  db: asValue(db),

  // Repositories
  userRepository: asClass(PostgresUserRepository).singleton(),
  todoRepository: asClass(PostgresTodoRepository).singleton(),

  // Auth use-cases
  registerUseCase: asClass(RegisterUseCase).singleton(),
  loginUseCase: asClass(LoginUseCase).singleton(),
  refreshUseCase: asClass(RefreshUseCase).singleton(),
  logoutUseCase: asClass(LogoutUseCase).singleton(),
  meUseCase: asClass(MeUseCase).singleton(),

  // Todo use-cases
  getAllTodosUseCase: asClass(GetAllTodosUseCase).singleton(),
  createTodoUseCase: asClass(CreateTodoUseCase).singleton(),
});
