import { TodoEntity } from "../entities/todo.entity";

export interface ITodoRepository {
  findAll(): Promise<TodoEntity[]>;
  create(data: { title: string; description: string }): Promise<TodoEntity>;
}
