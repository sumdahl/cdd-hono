import { ITodoRepository } from "../../src/server/core/repositories/todo.repository";
import { TodoEntity } from "../../src/server/core/entities/todo.entity";

export class InMemoryTodoRepository implements ITodoRepository {
  private todos: TodoEntity[] = []; // ← instance level, isolated per test

  async findAll(): Promise<TodoEntity[]> {
    return this.todos;
  }

  async create(data: {
    title: string;
    description: string;
  }): Promise<TodoEntity> {
    const todo = new TodoEntity(
      (this.todos.length + 1).toString(),
      data.title,
      data.description,
      false,
    );
    this.todos.push(todo);
    return todo;
  }
}
