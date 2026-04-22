import { ITodoRepository } from "../../repositories/todo.repository";

export class CreateTodoUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute(data: { title: string; description: string }) {
    return this.todoRepository.create(data);
  }
}
