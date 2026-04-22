import { describe, it, expect, mock } from "bun:test";
import { CreateTodoUseCase } from "../../../src/server/core/use-cases/todos/create-todo";
import { ITodoRepository } from "../../../src/server/core/repositories/todo.repository";
import { TodoEntity } from "../../../src/server/core/entities/todo.entity";

const mockRepository: ITodoRepository = {
  findAll: mock(async () => []),
  create: mock(
    async (data) => new TodoEntity("1", data.title, data.description, false),
  ),
};

describe("CreateTodoUseCase", () => {
  it("should create a todo", async () => {
    const useCase = new CreateTodoUseCase(mockRepository);
    const todo = await useCase.execute({
      title: "Learn Clean Architecture",
      description: "Build scalable APIs",
    });

    expect(todo).toBeInstanceOf(TodoEntity);
    expect(todo.title).toBe("Learn Clean Architecture");
    expect(todo.description).toBe("Build scalable APIs");
    expect(todo.isCompleted).toBe(false);
  });

  it("should call repository.create with correct data", async () => {
    const useCase = new CreateTodoUseCase(mockRepository);
    await useCase.execute({ title: "Test", description: "Test desc" });

    expect(mockRepository.create).toHaveBeenCalledWith({
      title: "Test",
      description: "Test desc",
    });
  });
});
