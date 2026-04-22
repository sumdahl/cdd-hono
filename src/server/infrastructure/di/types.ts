import { DB } from "../db";
import { PostgresUserRepository } from "../persistence/user.pg.repository";
import { PostgresTodoRepository } from "../persistence/todo.pg.repository";
import { RegisterUseCase } from "../../core/use-cases/auth/register";
import { LoginUseCase } from "../../core/use-cases/auth/login";
import { RefreshUseCase } from "../../core/use-cases/auth/refresh";
import { LogoutUseCase } from "../../core/use-cases/auth/logout";
import { MeUseCase } from "../../core/use-cases/auth/me";
import { GetAllTodosUseCase } from "../../core/use-cases/todos/get-all-todos";
import { CreateTodoUseCase } from "../../core/use-cases/todos/create-todo";

export interface Cradle {
  // Infrastructure
  db: DB;

  // Repositories
  userRepository: PostgresUserRepository;
  todoRepository: PostgresTodoRepository;

  // Auth use-cases
  registerUseCase: RegisterUseCase;
  loginUseCase: LoginUseCase;
  refreshUseCase: RefreshUseCase;
  logoutUseCase: LogoutUseCase;
  meUseCase: MeUseCase;

  // Todo use-cases
  getAllTodosUseCase: GetAllTodosUseCase;
  createTodoUseCase: CreateTodoUseCase;
}
