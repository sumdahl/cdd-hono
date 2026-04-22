import { container } from "../../di/container";
import { createTodoRouter } from "./todo.routes";

const { getAllTodosUseCase, createTodoUseCase } = container.cradle;

export const todoRouter = createTodoRouter(
  getAllTodosUseCase,
  createTodoUseCase,
);
