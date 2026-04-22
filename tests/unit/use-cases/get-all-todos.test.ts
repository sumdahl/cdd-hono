import { describe, it, expect, mock } from "bun:test";
import { GetAllTodosUseCase } from "../../../src/server/core/use-cases/todos/get-all-todos";
import { ITodoRepository } from "../../../src/server/core/repositories/todo.repository";
import { TodoEntity } from "../../../src/server/core/entities/todo.entity";

const mockRepository: ITodoRepository = {
  findAll: mock(async () => [
    new TodoEntity("1", "Buy groceries", "Milk, Bread and Egg", false),
    new TodoEntity("2", "Learn Hono", "Build APIs", false),
  ]),
  create: mock(async () => new TodoEntity("3", "Test", "Test desc", false)),
};

describe("GetAllTodosUseCase", () => {
  it("should return all todos", async () => {
    const useCase = new GetAllTodosUseCase(mockRepository);
    const todos = await useCase.execute();

    expect(todos).toHaveLength(2);
    expect(todos[0].title).toBe("Buy groceries");
    expect(todos[1].title).toBe("Learn Hono");
  });

  it("should return TodoEntity instances", async () => {
    const useCase = new GetAllTodosUseCase(mockRepository);
    const todos = await useCase.execute();

    todos.forEach((todo) => {
      expect(todo).toBeInstanceOf(TodoEntity);
    });
  });
});
