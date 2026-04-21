import { describe, it, expect, beforeAll } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { InMemoryTodoRepository } from "../../mocks/todo.in-memory.repository";
import { GetAllTodosUseCase } from "../../../src/server/core/use-cases/todos/get-all-todos";
import { CreateTodoUseCase } from "../../../src/server/core/use-cases/todos/create-todo";
import { createTodoRouter } from "../../../src/server/infrastructure/http/todos/todo.routes";

let app: OpenAPIHono;

beforeAll(() => {
  const repository = new InMemoryTodoRepository();
  const getAllTodos = new GetAllTodosUseCase(repository);
  const createTodo = new CreateTodoUseCase(repository);
  const todoRouter = createTodoRouter(getAllTodos, createTodo);

  app = new OpenAPIHono();
  app.route("/api/v1/todos", todoRouter);
});

describe("GET /api/v1/todos", () => {
  it("should return 200 with todos array", async () => {
    const res = await app.request("/api/v1/todos");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("todos");
    expect(Array.isArray(body.todos)).toBe(true);
  });
});

describe("POST /api/v1/todos", () => {
  it("should create a todo and return 201", async () => {
    const res = await app.request("/api/v1/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Todo",
        description: "Test description",
      }),
    });
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.todo.title).toBe("Test Todo");
    expect(body.todo.description).toBe("Test description");
    expect(body.todo.isCompleted).toBe(false);
  });

  it("should return 422 on invalid input", async () => {
    const res = await app.request("/api/v1/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "" }),
    });
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
