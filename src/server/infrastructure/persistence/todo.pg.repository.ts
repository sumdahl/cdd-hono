import { DB } from "../db";
import { todos } from "./schema/todo.schema";
import { ITodoRepository } from "../../core/repositories/todo.repository";
import { TodoEntity } from "../../core/entities/todo.entity";
import { AppError } from "../../core/errors";
import { ErrorCode } from "../../core/errors";

export class PostgresTodoRepository implements ITodoRepository {
  constructor(private readonly db: DB) {}

  async findAll(): Promise<TodoEntity[]> {
    try {
      const rows = await this.db.select().from(todos);
      return rows.map(
        (r) =>
          new TodoEntity(r.id, r.title, r.description ?? "", r.isCompleted),
      );
    } catch (err) {
      throw new AppError(ErrorCode.DB_ERROR, "Failed to fetch todos", 500);
    }
  }

  async create(data: {
    title: string;
    description: string;
  }): Promise<TodoEntity> {
    try {
      const id = crypto.randomUUID();
      const [row] = await this.db
        .insert(todos)
        .values({
          id,
          title: data.title,
          description: data.description,
          isCompleted: false,
        })
        .returning();
      return new TodoEntity(
        row.id,
        row.title,
        row.description ?? "",
        row.isCompleted,
      );
    } catch (err) {
      throw new AppError(ErrorCode.DB_ERROR, "Failed to create todo", 500);
    }
  }
}
