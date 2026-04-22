import { ITodoRepository } from "../../repositories/todo.repository";

export class GetAllTodosUseCase {
  constructor(private readonly todoRepository: ITodoRepository) {}

  async execute() {
    return this.todoRepository.findAll();
  }
}
